import INSTRUCTIONS from "./md/INSTRUCTIONS.json" with { type: "json" };

/** No options yet — the type is reserved so the signature can grow without breaking callers. */
export type CommonInstructionsPromptOptions = Record<string, never>;

/**
 * The LLM-facing instruction block — the contract authored in
 * `md/INSTRUCTIONS.md` and imported here as a JSON string via the md-to-json
 * pipeline (`npm run md-to-json` regenerates the `.json` sibling after edits).
 * The app composes it with the other `get*PartialPrompt` builders into its
 * system prompt — core ships the pieces; the app owns the assembly.
 */
export function getCommonInstructionsPartialPrompt(
	_options: CommonInstructionsPromptOptions = {},
): string {
	// No edge blank lines — assembly's `\n\n` join owns the separators.
	return INSTRUCTIONS.trim();
}
