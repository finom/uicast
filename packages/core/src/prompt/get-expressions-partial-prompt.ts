import { ALLOWED_GLOBALS, DEFAULT_MAX_SOURCE_LENGTH } from "@uicast/expr/internal";
import { joinSections, noteSection } from "./format";
import EXPRESSIONS from "./md/EXPRESSIONS.json" with { type: "json" };

/**
 * Options for `getExpressionsPartialPrompt`.
 *
 * @example
 * const options: ExpressionsPromptOptions = { maxLength: 500 };
 */
export type ExpressionsPromptOptions = {
  /** The evaluator's `maxSourceLength`: the longest expression, in characters. Default 1000. */
  maxLength?: number;
  /** Your text, appended verbatim as a trailing `## Note`. */
  note?: string;
};

/**
 * The `# JavaScript Expressions` block: the language's rules, its globals and a few idioms. The globals and the
 * default length come from `@uicast/expr` itself.
 *
 * @example
 * getExpressionsPartialPrompt();
 *
 * @example
 * getExpressionsPartialPrompt({ maxLength: 500 }); // with new Evaluator({ maxSourceLength: 500 })
 */
export function getExpressionsPartialPrompt({
  maxLength = DEFAULT_MAX_SOURCE_LENGTH,
  note,
}: ExpressionsPromptOptions = {}): string {
  const language = EXPRESSIONS.replace("🔴ALLOWED_GLOBALS🔴", ALLOWED_GLOBALS.join(", ")).replace(
    "🔴MAX_LENGTH🔴",
    String(maxLength),
  );
  return joinSections(language.trim(), noteSection(note));
}
