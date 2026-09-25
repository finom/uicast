import { joinSections, noteSection } from "./format";
// Generated from `md/INSTRUCTIONS.md`: run `npm run md-to-json` after editing it.
import INSTRUCTIONS from "./md/INSTRUCTIONS.json" with { type: "json" };

/**
 * Options for `getCommonInstructionsPartialPrompt`.
 *
 * @example
 * const options: CommonInstructionsPromptOptions = { maxListItems: 50 };
 */
export type CommonInstructionsPromptOptions = {
  /** Most items one list may render; the model pages or filters past it. Default 100. */
  maxListItems?: number;
  /** Your text, appended verbatim as a trailing `## Note` section. */
  note?: string;
};

/**
 * The rules every surface needs: the output format, partial replacement, and the names an expression can read
 * (`scopes`, `evt`, `currentValue`, host functions). The language itself is `getExpressionsPartialPrompt`; use both.
 *
 * @example
 * const system = [getCommonInstructionsPartialPrompt(), getExpressionsPartialPrompt()].join("\n\n");
 *
 * @example
 * getCommonInstructionsPartialPrompt({ note: "scopes.userCtx holds the signed-in user: name, plan; read-only." });
 */
export function getCommonInstructionsPartialPrompt({
  maxListItems = 100,
  note,
}: CommonInstructionsPromptOptions = {}): string {
  return joinSections(INSTRUCTIONS.replaceAll("🔴MAX_LIST_ITEMS🔴", String(maxListItems)).trim(), noteSection(note));
}
