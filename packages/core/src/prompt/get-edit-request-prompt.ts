import { joinSections } from "./format";

export type EditRequestPromptOptions = {
	request: string;
	// Referenced as children but never emitted; the model re-emits them.
	missingKeys?: string[];
};

// Per-turn content, not a system-prompt partial.
export function getEditRequestPrompt({ request, missingKeys = [] }: EditRequestPromptOptions): string {
	return joinSections(
		request,
		"Update the previously generated page above. Emit ONLY the entries that change: re-emit an existing key to replace that entry (its new `children` array defines the new subtree — children you still reference are kept as-is, so do not re-emit them), use fresh keys for new entries, and do not re-emit unchanged entries. Never re-emit the whole page. `seed` on re-emitted keys does NOT re-run — initialize any NEW state via the `seed` of a newly-keyed entry instead.",
		missingKeys.length > 0 &&
			`Warning: the page above references child keys that were never emitted (the earlier response was cut off): ${missingKeys.join(", ")}. These entries do NOT exist — emit them now, or re-emit their parents with corrected children.`,
	);
}
