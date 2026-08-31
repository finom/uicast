import type { ConfirmableValueSourceAssignment } from "@uicast/core";
import {
	evaluate,
	getFreeIdentifiers,
	planStepWaves,
} from "@uicast/core/internal";
import type { StandardToolV0 } from "standard-tool";
import { getItemWriteAliases } from "../item-write-forwarding";
import type { ConfirmFn } from "../providers/confirm";
import { readScopePath } from "../read-scope-path";
import { parseStepTargets } from "../step-targets";
import type { Scopes } from "../types";

/**
 * Run one wired callback's steps in dependency waves (see planStepWaves):
 * reads wait for earlier writes, independent pure steps parallelize, and
 * `confirm` / host-function steps are barriers — a mutation's effect is
 * invisible to path analysis, so effectful steps never race. Throws the first
 * classified failure; resolves early on a declined `confirm`.
 */
export async function runCallbackSteps({
	steps,
	payload,
	scopes,
	confirm,
	functions,
	allowGlobals,
	elementKey,
}: {
	steps: ConfirmableValueSourceAssignment[];
	payload: unknown;
	scopes: Scopes;
	confirm: ConfirmFn;
	functions?: StandardToolV0[];
	allowGlobals?: string[];
	elementKey: string;
}): Promise<void> {
	const targets = parseStepTargets(steps, elementKey);

	// Exact-name match on the evaluator's own parse, not a regex over source.
	// An invalid expression throws classified at evaluation — not the
	// barrier's problem, so the predicate just says "no barrier".
	const callsHostFunction = (expr: string | undefined): boolean => {
		if (!expr || !functions?.length) return false;
		try {
			const freeIds = getFreeIdentifiers(expr);
			return functions.some((fn) => freeIds.includes(fn.name));
		} catch {
			return false;
		}
	};
	const waves = planStepWaves(
		steps,
		(step) => callsHostFunction("expr" in step ? step.expr : undefined),
		// A row-scope write also changes the source array / childScopes readers,
		// so declare those paths — a later step reading them waits for it.
		(step) => {
			const target = targets.get(step);
			if (!target) return [];
			const [scopeName, path] = target;
			const scope = scopes[scopeName];
			if (!scope) return [];
			return getItemWriteAliases(
				scope,
				path === "item" || path.startsWith("item."),
			);
		},
	);

	for (const wave of waves) {
		if (wave[0].confirm) {
			const confirmed = await confirm(wave[0].confirm);
			if (!confirmed) return;
		}
		const evaluated = wave.map((step) => {
			const target = targets.get(step) ?? null;
			const currentValue = target
				? readScopePath(scopes[target[0]], target[1])
				: undefined;
			// Evaluate inside an async thunk: a synchronous throw becomes a
			// rejection, so allSettled observes every step and nothing rejects
			// unhandled.
			return {
				target,
				value: (async () =>
					evaluate(
						step,
						{ evt: payload, scopes, currentValue },
						{ functions, allowGlobals },
					))(),
			};
		});
		// Let every step in the wave settle, apply the successful writes in step
		// order, then fail on the first rejection — so parallel peers of a failed
		// step still land, and later waves are skipped.
		const settled = await Promise.allSettled(evaluated.map((e) => e.value));
		let firstError: unknown = null;
		settled.forEach((result, i) => {
			if (result.status === "fulfilled") {
				const { target } = evaluated[i];
				if (target) {
					scopes[target[0]].$set(target[1], result.value);
				}
			} else if (firstError === null) {
				firstError = result.reason;
			}
		});
		if (firstError !== null) throw firstError;
		// One macrotask between waves, so React commits the writes above before
		// the next wave evaluates. Load-bearing for one cross-wave read:
		// `childScopes.<as>` republishes in the list's commit effect, so a wave
		// that replaced a list's array must yield for a later wave to read the
		// fresh row set through childScopes.
		await new Promise((resolve) => setTimeout(resolve, 0));
	}
}
