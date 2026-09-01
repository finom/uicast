export type EditRequestPromptOptions = {
	/** The user's change request, e.g. "Add pagination to the orders table". */
	request: string;
	/** Keys referenced as children but never emitted — listed so the model re-emits them instead of keeping them by reference. */
	missingKeys?: string[];
};

/** The user-turn message for an incremental edit: the change request plus the re-emit-a-key convention. Per-turn content, not a system-prompt partial. */
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
