import { EntryError } from "../entry-error";
import type {
	ComponentEntry,
	ConfirmableValueSourceAssignment,
} from "../types";

// Static rejection of `set` paths (plain strings — the evaluator never sees
// them). Numeric keys write without waking container readers; prototype keys
// land on `Object.prototype`. The proxy guards the sink; this is the early,
// classified rejection.

/** Keys that resolve into the prototype chain; rejected at every segment, scope name included. */
const PROTOTYPE_KEYS = new Set([
	"__proto__",
	"constructor",
	"prototype",
	"__defineGetter__",
	"__defineSetter__",
	"__lookupGetter__",
	"__lookupSetter__",
]);

/** Why a `set` path was rejected, and which segment did it. */
export type SetPathFault = {
	segment: string;
	kind: "numeric" | "prototype";
};

/** First rejectable segment, or `null`. Prototype keys win; the numeric rule skips the scope name. */
export function findSetPathFault(setPath: string): SetPathFault | null {
	const normalized = setPath.startsWith("scopes.") ? setPath.slice(7) : setPath;
	const segments = normalized.split(".");

	for (const segment of segments) {
		if (PROTOTYPE_KEYS.has(segment)) {
			return { segment, kind: "prototype" };
		}
	}
	// Skip the scope name; every remaining segment is a written key.
	for (const segment of segments.slice(1)) {
		if (/^\d+$/.test(segment)) return { segment, kind: "numeric" };
	}
	return null;
}

/** First all-digit segment after the scope name, or `null`. */
export function findNumericSetSegment(setPath: string): string | null {
	const fault = findSetPathFault(setPath);
	return fault?.kind === "numeric" ? fault.segment : null;
}

/**
 * One rejection builder for the mount-time scan and the step runners. The
 * message names the fix — the recovery prompt forwards it verbatim.
 */
export function setPathError(
	setPath: string,
	fault: SetPathFault,
	elementKey?: string,
): EntryError {
	const message =
		fault.kind === "prototype"
			? `"set": "${setPath}" writes through "${fault.segment}", which reaches the prototype chain. ` +
				`Write to a plain data path under the scope ("scopes.root.<field>").`
			: `"set": "${setPath}" writes into a container by numeric key ("${fault.segment}"). ` +
				`Edit a list row through its item scope ("scopes.<as>.item.<field>") ` +
				`or replace the container wholesale.`;
	return new EntryError(message, {
		reason: "guardrail-violation",
		elementKey,
	});
}

/** First rejectable `set` path in an entry's seed/callbacks, or `null`. Pure string scan. */
export function findEntrySetPathFault(
	entry: Pick<ComponentEntry, "seed" | "callbacks">,
): { set: string; fault: SetPathFault } | null {
	const stepLists: (readonly ConfirmableValueSourceAssignment[])[] = [];
	if (entry.seed) stepLists.push(entry.seed);
	if (entry.callbacks) stepLists.push(...Object.values(entry.callbacks));
	for (const steps of stepLists) {
		for (const step of steps) {
			if (!step.set) continue;
			const fault = findSetPathFault(step.set);
			if (fault) return { set: step.set, fault };
		}
	}
	return null;
}

/** The prototype keys the sink guard rejects too. Not part of the public API. */
export { PROTOTYPE_KEYS };
