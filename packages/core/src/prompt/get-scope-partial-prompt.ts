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
  page: `Generate a **complete, functional page** — the unit of output is a whole working page, not a fragment. A single header, title, or lone element is never a sufficient response.

- Treat a terse request as a request for the obvious full version of that page. Infer the missing details from the domain: the host functions tell you what data exists; the component list tells you what you can build with it. "Order dashboard" implies the full shape — summary stats, a data table bound to real data, filters, row actions.
- Bind real data wherever a host function provides it. Fetch with \`seed\` and render from state — do not fill components with invented placeholder content when a function returns the real thing.
- Wire the interactions a page of this kind is expected to have: forms that submit, filters that filter, destructive actions with \`confirm\`. A control that does nothing on interaction is a defect.
- Completeness is not padding: build what the request and the domain support, and stop there. Do not invent sections no host function can populate.`,
  widget: `Generate a **single, self-contained widget** — one focused piece of UI meant to be embedded into a host layout, not a full page.

- Build exactly the widget the request names, complete and functional: bind real data via host functions and wire its interactions.
- No page chrome: no page headers, navigation, or sections beyond the widget itself. Keep the tree as small as the widget allows.`,
  answer: `You are answering a question inside a conversation. Produce a **compact, self-contained piece of UI that fully answers it** — typically a stat, a chart, a table, or a small combination — not a full page.

- Use the fewest entries that fully answer the question; skip page chrome (headers, navigation, filter bars) unless asked.
- Bind real data via host functions — the answer must show actual values, not placeholders.`,
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
      `A typical response on this surface is around ${approxEntries} entries (JSONL lines) — treat this as a hint about ambition, not a quota.`,
    noteSection(note),
  );
}
