import INSTRUCTIONS from "./md/INSTRUCTIONS.json" with { type: "json" };
import { noteSection } from "./note-section";

export type CommonInstructionsPromptOptions = {
	// Most items one list may render before slicing or paging. Default 100.
	maxListItems?: number;
	// Appended as a trailing `## Note` section, verbatim.
	note?: string;
};

// Renders `md/INSTRUCTIONS.md`; run `npm run md-to-json` after editing it.
export function getCommonInstructionsPartialPrompt({
	maxListItems = 100,
	note,
}: CommonInstructionsPromptOptions = {}): string {
	const instructions = INSTRUCTIONS.replaceAll(
		"🔴MAX_LIST_ITEMS🔴",
		String(maxListItems),
	).trim();
	// Assembly's `\n\n` join owns the separators.
	return [instructions, noteSection(note)].filter(Boolean).join("\n\n");
}
