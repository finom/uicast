import { EntryError } from "../entry-error";
import type {
	ComponentEntry,
	ConfirmableValueSourceAssignment,
} from "../types";

// A numeric key in a `set` path is rejected statically: the write would land
// without waking the container's readers (writes wake downward, never above) —
// a silently stale UI. Blessed spellings: the row's item scope, or replacing
// the container wholesale. The check is textual, so digit-keyed object maps
// are caught too.

/**
 * First all-digit segment after the scope name (`"scopes.root.rows.0.qty"` →
 * `"0"`), or `null`. Malformed paths are left for `parseScope` to reject.
 */
export function findNumericSetSegment(setPath: string): string | null {
	const normalized = setPath.startsWith("scopes.")
		? setPath.slice(7)
		: setPath;
	// Skip the scope name; every remaining segment is a written key.
	for (const segment of normalized.split(".").slice(1)) {
		if (/^\d+$/.test(segment)) return segment;
	}
	return null;
}

/**
 * One rejection builder for the mount-time scan and the step runners. The
 * message names the fix — the recovery prompt forwards it verbatim.
 */
export function numericSetPathError(
	setPath: string,
	segment: string,
	elementKey?: string,
): EntryError {
	return new EntryError(
		`"set": "${setPath}" writes into a container by numeric key ("${segment}"). ` +
			`Edit a list row through its item scope ("scopes.<as>.item.<field>") ` +
			`or replace the container wholesale.`,
		{ reason: "guardrail-violation", elementKey },
	);
}

/**
 * First numeric-key `set` path in an entry's `seed`/`callbacks`, or `null`.
 * Pure string scan — a renderer can reject the entry the moment it arrives,
 * before any step executes.
 */
export function findNumericSetPath(
	entry: Pick<ComponentEntry, "seed" | "callbacks">,
): { set: string; segment: string } | null {
	const stepLists: (readonly ConfirmableValueSourceAssignment[])[] = [];
	if (entry.seed) stepLists.push(entry.seed);
	if (entry.callbacks) stepLists.push(...Object.values(entry.callbacks));
	for (const steps of stepLists) {
		for (const step of steps) {
			if (!step.set) continue;
			const segment = findNumericSetSegment(step.set);
			if (segment !== null) return { set: step.set, segment };
		}
	}
	return null;
}
