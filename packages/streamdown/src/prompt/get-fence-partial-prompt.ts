import { noteSection } from "@uicast/core/internal";

/**
 * Options for `getFencePartialPrompt`.
 *
 * @example
 * const options: FencePromptOptions = { note: "Keep each reply to one fence." };
 */
export type FencePromptOptions = {
  /** Your text, appended verbatim as a trailing `## Note`. */
  note?: string;
};

/**
 * The `# Emitting UI` block for Markdown chat replies: entries go in a `uicast` fence, and every block shares the
 * `root` scope. Add it after the core blocks.
 *
 * @example
 * const system = [...coreBlocks, getFencePartialPrompt()].join("\n\n");
 */
export function getFencePartialPrompt({ note }: FencePromptOptions = {}): string {
  const fence = `# Emitting UI

You are replying in Markdown inside a chat. To render live UI, emit your JSONL component entries inside a fenced code block whose language token is exactly \`uicast\`:

\`\`\`uicast
{"key":"root","component":"...","children":["..."]}
{"key":"...","component":"..."}
\`\`\`

- On this chat surface, the fence convention REPLACES the raw-JSONL output rule from the instructions above: the reply itself is Markdown, and only fence bodies are raw JSONL.
- The \`uicast\` language token is what routes the block to the UI renderer — with any other token the block shows as plain code.
- Inside the fence: one JSON object per line, exactly as specified above — no prose, no comments, no Markdown.
- Markdown prose before and after the fence is fine; use it to introduce or summarize, not to duplicate what the UI already shows.
- The whole conversation is ONE app with ONE live \`root\` scope: every fence renders against the same state, and a write in one block updates every block that reads that path, immediately. Entry keys are still per-fence — only state is shared.
- Treat \`scopes.root\` like the app's store: reuse an existing path for the same data (\`scopes.root.products\` means the products everywhere), and pick a path that isn't already used for something else when you introduce new state — earlier blocks in this conversation show which paths exist.
- Every block MUST seed every path it reads — even paths an earlier block already loaded. Seeds never overwrite existing state (first writer wins): in the chat a repeated seed is a no-op, and a block extracted from the chat (saved as a standalone page) still loads its own data. Never rely on another block's seeds. State another block writes only through user interaction can't be seeded — read such paths defensively (\`path || fallback\`).
- Re-emitting a \`key\` (partial replacement) only works WITHIN one fence. To correct or change UI from an earlier reply, emit a new fence containing the complete corrected UI — a lone corrected entry would render as its own tiny document, not patch the earlier one.
- Never wrap uicast entries in any other fence language (\`json\`, \`jsonl\`, …) — those render as plain code, not UI.`;
  return [fence, noteSection(note)].filter(Boolean).join("\n\n");
}
