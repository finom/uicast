import { ALLOWED_GLOBALS, DEFAULT_MAX_SOURCE_LENGTH } from "@uicast/expr/internal";
import EXPRESSIONS from "./md/EXPRESSIONS.json" with { type: "json" };
import { noteSection } from "./note-section";

export type ExpressionsPromptOptions = {
	// The evaluator's `maxSourceLength`. Default 1000.
	maxLength?: number;
	// Host-specific context, appended as a trailing `## Note`.
	note?: string;
};

// The globals and length slots fill from @uicast/expr's own constants.
export function getExpressionsPartialPrompt({
	maxLength = DEFAULT_MAX_SOURCE_LENGTH,
	note,
}: ExpressionsPromptOptions = {}): string {
	const language = EXPRESSIONS.replace("🔴ALLOWED_GLOBALS🔴", ALLOWED_GLOBALS.join(", "))
		.replace("🔴MAX_LENGTH🔴", String(maxLength))
		.trim();
	return [language, noteSection(note)].filter(Boolean).join("\n\n");
}
