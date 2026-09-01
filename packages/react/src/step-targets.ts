import { EntryError } from "@uicast/core";
import {
	findSetPathFault,
	parseScope,
	setPathError,
} from "@uicast/core/internal";

/** Pre-validate every step's `set` path so a bad one fails classified before any step runs. Effect-only steps skipped; `currentValue` binds off the parsed target. */
export function parseStepTargets<T extends { set?: string }>(
	steps: readonly T[],
	elementKey: string,
): Map<T, [string, string]> {
	const targets = new Map<T, [string, string]>();
	for (const step of steps) {
		if (!step.set) continue;
		const fault = findSetPathFault(step.set);
		if (fault) {
			throw setPathError(step.set, fault, elementKey);
		}
		try {
			targets.set(step, parseScope(step.set));
		} catch (err) {
			throw EntryError.wrap(err, "unknown-reference", elementKey);
		}
	}
	return targets;
}
