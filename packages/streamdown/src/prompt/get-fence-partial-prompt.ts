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

Reply is Markdown in chat. For live UI, put JSONL entries in code fence with language \`uicast\`:

\`\`\`uicast
{"key":"root","component":"...","children":["..."]}
{"key":"...","component":"..."}
\`\`\`

- Fences REPLACE the raw-JSONL output rule above: reply is Markdown, only fence bodies are JSONL.
- Only \`uicast\` fence renders. Never put entries in \`json\`, \`jsonl\` or any other fence language: shows as plain code.
- Inside fence: one JSON object per line, nothing else.
- Prose around fences fine: introduce or sum up, don't repeat what UI shows.
- Whole chat is ONE app with ONE live \`root\` scope: every fence reads and writes same state; write in one block updates every block reading it. Keys per fence; state shared.
- \`scopes.root\` = app store: same data, same path (\`scopes.root.products\` everywhere); new state, unused path. Earlier blocks show paths in use.
- Every block MUST seed every path it reads, even ones earlier blocks loaded. Seeds never overwrite (first writer wins): repeat seed is no-op, and block saved as standalone page still loads own data. Path set only by another block's user action can't be seeded: read defensively (\`scopes.root.x ?? fallback\`).
- Re-emitting key only works WITHIN one fence. To change earlier reply's UI, emit new fence with complete corrected UI; lone entry renders as own tiny document.`;
  return [fence, noteSection(note)].filter(Boolean).join("\n\n");
}
