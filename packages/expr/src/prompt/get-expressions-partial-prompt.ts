import { ALLOWED_GLOBALS } from "../globals";
import EXPRESSIONS from "./EXPRESSIONS.json" with { type: "json" };
import { DEFAULT_MAX_SOURCE_LENGTH } from "../parse";
import { noteSection } from "./note-section";

export type ExpressionsPromptOptions = {
	/** Extra global names to print — the same list the evaluator's `globals` option was widened with. */
	allowGlobals?: readonly string[];
	/** The evaluator's `maxSourceLength`, when the host changed it. Default 1000. */
	maxLength?: number;
	/** Host-specific context, appended as a trailing `## Note`. */
	note?: string;
};

/** The `# JavaScript Expressions` section, next to the evaluator so it cannot drift — globals and length fill from the source constants. */
export function getExpressionsPartialPrompt({
	allowGlobals = [],
	maxLength = DEFAULT_MAX_SOURCE_LENGTH,
	note,
}: ExpressionsPromptOptions = {}): string {
	const globals = [...new Set([...ALLOWED_GLOBALS, ...allowGlobals])].join(", ");
	// Replacer fn keeps `$&`-style patterns in host-supplied names literal.
	const language = EXPRESSIONS.replace("🔴ALLOWED_GLOBALS🔴", () => globals)
		.replace("🔴MAX_LENGTH🔴", () => String(maxLength))
		.trim();
	return [language, noteSection(note)].filter(Boolean).join("\n\n");
}
