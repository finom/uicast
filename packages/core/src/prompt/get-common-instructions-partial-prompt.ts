import INSTRUCTIONS from "./md/INSTRUCTIONS.json" with { type: "json" };

/** No options yet — the type is reserved so the signature can grow without breaking callers. */
export type CommonInstructionsPromptOptions = Record<string, never>;

/**
 * The LLM-facing instruction block — the contract authored in
 * `md/INSTRUCTIONS.md` and imported here as a JSON string via the md-to-json
 * pipeline (`npm run md-to-json` regenerates the `.json` sibling after edits).
 *
 * A partial-prompt primitive: the consuming app's prompt assembler composes
 * this — alongside the other `get*PartialPrompt` builders — into the full
 * system prompt it sends to the generation LLM. core ships the pieces; the app
 * owns the assembly.
 */
export function getCommonInstructionsPartialPrompt(
	_options: CommonInstructionsPromptOptions = {},
): string {
	return INSTRUCTIONS;
}
