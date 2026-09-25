import { ALLOWED_GLOBALS, DEFAULT_MAX_SOURCE_LENGTH } from "@uicast/expr/internal";
import { joinSections, noteSection } from "./format";
import EXPRESSIONS from "./md/EXPRESSIONS.json" with { type: "json" };

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
  const language = EXPRESSIONS.replace("🔴ALLOWED_GLOBALS🔴", ALLOWED_GLOBALS.join(", ")).replace(
    "🔴MAX_LENGTH🔴",
    String(maxLength),
  );
  return joinSections(language.trim(), noteSection(note));
}
