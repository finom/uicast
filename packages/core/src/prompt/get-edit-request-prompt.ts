export type EditRequestPromptOptions = {
	/** The user's change request, e.g. "Add pagination to the orders table". */
	request: string;
	/**
	 * Keys referenced as children in the replayed tree but never emitted —
	 * typically the tail of an earlier response that was cut off. Listing them
	 * tells the model those elements do NOT exist, so it re-emits them instead
	 * of keeping them by reference.
	 */
	missingKeys?: string[];
};

/**
 * The user-turn message for an incremental edit: the host replays the page's
 * current JSONL as an assistant turn, then sends this — the change request
 * plus the re-emit-a-key delta convention — so the model emits only the
 * elements that change. Per-turn message content, not a system-prompt partial.
 */
export function getEditRequestPrompt({
	request,
	missingKeys = [],
}: EditRequestPromptOptions): string {
	return [
		request,
		"Update the previously generated page above. Emit ONLY the elements that change: re-emit an existing key to replace that element (its new `children` array defines the new subtree — children you still reference are kept as-is, so do not re-emit them), use fresh keys for new elements, and do not re-emit unchanged elements. Never re-emit the whole page. `seed` on re-emitted keys does NOT re-run — initialize any NEW state via the `seed` of a newly-keyed element instead.",
		missingKeys.length > 0
			? `Warning: the page above references child keys that were never emitted (the earlier response was cut off): ${missingKeys.join(", ")}. These elements do NOT exist — emit them now, or re-emit their parents with corrected children.`
			: "",
	]
		.filter(Boolean)
		.join("\n\n");
}
