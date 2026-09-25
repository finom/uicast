import { joinSections, noteSection } from "./format";

/**
 * Options for `getScopePartialPrompt`.
 *
 * @example
 * const options: ScopePromptOptions = { kind: "answer", approxEntries: 10 };
 */
export type ScopePromptOptions = {
  /** What to build: `"page"` a complete page, `"widget"` one embedded widget, `"answer"` a compact chat answer. */
  kind: "page" | "widget" | "answer";
  /** A size hint, printed as "around N entries". Not a limit. */
  approxEntries?: number;
  /** Your text, appended verbatim as this section's trailing `## Note`. */
  note?: string;
};

const KIND_SECTIONS: Record<ScopePromptOptions["kind"], string> = {
  page: `Build **complete, working page**: whole page, never fragment or lone element.

- Terse request = obvious full version. Infer rest from domain: functions show what data exists, components what you can build. "Order dashboard" = summary stats, table bound to real data, filters, row actions.
- Bind real data wherever host function gives it: fetch in \`seed\`, render from state. No invented placeholder content.
- Wire interactions page needs: forms submit, filters filter, destructive actions \`confirm\`. Control that does nothing = defect.
- No padding: build what request and data support, then stop. No section no function can fill.`,
  widget: `Build **one self-contained widget** for host's layout, not page.

- Exactly widget asked for, complete: real data from host functions, interactions wired.
- No page chrome: no headers, navigation, extra sections. Smallest tree that works.`,
  answer: `Answering question in chat. Build **compact UI that fully answers it**: stat, chart, table or small mix, not page.

- Fewest entries that answer it. No page chrome (headers, navigation, filter bars) unless asked.
- Real values from host functions, never placeholders.`,
};

/**
 * The `# Scope` block: what one response should be, a whole page, one widget or a chat answer.
 *
 * @example
 * getScopePartialPrompt({ kind: "page" });
 *
 * @example
 * getScopePartialPrompt({ kind: "answer", approxEntries: 10 });
 */
export function getScopePartialPrompt({ kind, approxEntries, note }: ScopePromptOptions): string {
  return joinSections(
    "# Scope",
    KIND_SECTIONS[kind],
    approxEntries !== undefined &&
      `Typical response here: around ${approxEntries} entries. Hint about ambition, not quota.`,
    noteSection(note),
  );
}
