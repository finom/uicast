import { joinSections, noteSection } from "./format";
import INSTRUCTIONS from "./md/INSTRUCTIONS.json" with { type: "json" };

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
  return joinSections(INSTRUCTIONS.replaceAll("🔴MAX_LIST_ITEMS🔴", String(maxListItems)).trim(), noteSection(note));
}
