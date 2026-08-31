import { EntryError } from "@uicast/core";
import {
	findNumericSetSegment,
	numericSetPathError,
	parseScope,
} from "@uicast/core/internal";

/**
 * Pre-validate every step's `set` path (unparseable → unknown-reference,
 * numeric key → guardrail) so a bad path fails before any step runs instead
 * of stranding its wave mid-flight. Effect-only steps are skipped. The
 * callback runner and the seed hook both bind `currentValue` off the parsed
 * `[scope, path]`.
 */
export function parseStepTargets<T extends { set?: string }>(
	steps: readonly T[],
	elementKey: string,
): Map<T, [string, string]> {
	const targets = new Map<T, [string, string]>();
	for (const step of steps) {
		if (!step.set) continue;
		const segment = findNumericSetSegment(step.set);
		if (segment !== null) {
			throw numericSetPathError(step.set, segment, elementKey);
		}
		try {
			targets.set(step, parseScope(step.set));
		} catch (err) {
			throw EntryError.wrap(err, "unknown-reference", elementKey);
		}
	}
	return targets;
}
