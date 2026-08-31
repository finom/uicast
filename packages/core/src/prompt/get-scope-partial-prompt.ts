export type ScopePromptOptions = {
	/**
	 * The kind of output the host surface expects:
	 * - `"page"` — a complete, functional page (a page-builder surface).
	 * - `"widget"` — one self-contained widget embedded into a host layout.
	 * - `"answer"` — a compact answer to a question inside a conversation.
	 */
	kind: "page" | "widget" | "answer";
	/** Soft size anchor, rendered as a hint ("around N elements"), not a quota. */
	approxElements?: number;
	/** Host-specific context, appended verbatim as the section's last paragraph. */
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
- No page chrome: no page headers, navigation, or sections beyond the widget itself. Keep the element tree as small as the widget allows.`,
	answer: `You are answering a question inside a conversation. Produce a **compact, self-contained piece of UI that fully answers it** — typically a stat, a chart, a table, or a small combination — not a full page.

- Use the fewest elements that fully answer the question; skip page chrome (headers, navigation, filter bars) unless asked.
- Bind real data via host functions — the answer must show actual values, not placeholders.`,
};

/**
 * The `# Scope` block — how ambitious the output should be on the host's
 * surface. The mechanical rules (INSTRUCTIONS.md) are surface-agnostic; this
 * partial is where the host says whether a request means a complete page, an
 * embeddable widget, or a compact conversational answer.
 *
 * Compose right after `getCommonInstructionsPartialPrompt()` so the scope
 * guidance sits with the output contract.
 */
export function getScopePartialPrompt({
	kind,
	approxElements,
	note,
}: ScopePromptOptions): string {
	return [
		"# Scope",
		KIND_SECTIONS[kind],
		approxElements !== undefined
			? `A typical response on this surface is around ${approxElements} elements (JSONL lines) — treat this as a hint about ambition, not a quota.`
			: "",
		note ?? "",
	]
		.filter(Boolean)
		.join("\n\n");
}
