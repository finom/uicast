import type { ConfirmableValueSourceAssignment, ExpressionEvaluator } from "@uicast/core";
import { evaluate, planStepWaves } from "@uicast/core/internal";
import { getItemWriteAliases } from "../item-write-forwarding";
import type { ConfirmFn } from "../providers/confirm";
import { readScopePath, requireScope } from "../read-scope-path";
import { parseStepTargets } from "../step-targets";
import type { Scopes } from "../types";

// Run a callback's steps in dependency waves; `confirm` and host calls are barriers (their effects are invisible to path analysis).
// Throws the first classified failure; a declined `confirm` resolves early.
export async function runCallbackSteps({
	steps,
	payload,
	scopes,
	confirm,
	evaluator,
	elementKey,
}: {
	steps: ConfirmableValueSourceAssignment[];
	payload: unknown;
	scopes: Scopes;
	confirm: ConfirmFn;
	evaluator: ExpressionEvaluator;
	elementKey: string;
}): Promise<void> {
	const targets = parseStepTargets(steps, elementKey);

	// The evaluator's own parse, not a regex. An invalid expression throws classified at evaluation; here it is simply not a barrier.
	const callsHostFunction = (expr: string | undefined): boolean => {
		if (!expr) return false;
		try {
			return evaluator.validate(expr).toolCalls.length > 0;
		} catch {
			return false;
		}
	};
	const waves = planStepWaves(
		steps,
		evaluator,
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
					evaluate(step, { evt: payload, scopes, currentValue }, evaluator))(),
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
					requireScope(scopes, target[0], elementKey).$set(target[1], result.value);
				}
			} else if (firstError === null) {
				firstError = result.reason;
			}
		});
		if (firstError !== null) throw firstError;
		// One macrotask so React commits prior writes — `childScopes.<as>`
		// republishes in the list's commit effect, and a later wave may read it.
		await new Promise((resolve) => setTimeout(resolve, 0));
	}
}
