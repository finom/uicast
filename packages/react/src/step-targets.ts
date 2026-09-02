import { parseSetAddress } from "@uicast/core/internal";

// Parse every step's `set` up front so a bad address fails classified before any step runs. Effect-only steps skipped.
export function parseStepTargets<T extends { set?: string }>(
	steps: readonly T[],
	elementKey: string,
): Map<T, { scope: string; field: string }> {
	const targets = new Map<T, { scope: string; field: string }>();
	for (const step of steps) {
		if (step.set) targets.set(step, parseSetAddress(step.set, elementKey));
	}
	return targets;
}
