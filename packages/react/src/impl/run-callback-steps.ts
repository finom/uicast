import type { ConfirmableValueSourceAssignment, ExpressionEvaluator, ReactiveProxy } from "@uicast/core";
import { evaluate, getForwardTargets, planStepWaves } from "@uicast/core/internal";
import type { ConfirmFn } from "../providers/confirm";
import { readField, requireScope } from "../read-scope-path";
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
		// A row write also wakes the fields its list's `each` reads, so declare
		// them — a later step reading one waits for it.
		(step) => {
			const target = targets.get(step);
			return target ? forwardedFields(scopes, target.scope) : [];
		},
	);

	for (const wave of waves) {
		if (wave[0].confirm) {
			const confirmed = await confirm(wave[0].confirm);
			if (!confirmed) return;
		}
		const evaluated = wave.map((step) => {
			const target = targets.get(step) ?? null;
			const currentValue = target ? readField(scopes, target.scope, target.field) : undefined;
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
					requireScope(scopes, target.scope, elementKey).$set(target.field, result.value);
				}
			} else if (firstError === null) {
				firstError = result.reason;
			}
		});
		if (firstError !== null) throw firstError;
	}
}

// Every `scopes.<scope>.<field>` a write to `scope` also emits on, transitively (a row forwards to its list's reads, which may be a row too).
function forwardedFields(scopes: Scopes, scope: string): string[] {
	const out: string[] = [];
	const visit = (proxy: ReactiveProxy | undefined) => {
		if (!proxy) return;
		for (const t of getForwardTargets(proxy)) {
			const name = Object.keys(scopes).find((k) => scopes[k] === t.scope);
			const key = `scopes.${name}.${t.field}`;
			if (name && !out.includes(key)) {
				out.push(key);
				visit(t.scope);
			}
		}
	};
	visit(scopes[scope]);
	return out;
}
