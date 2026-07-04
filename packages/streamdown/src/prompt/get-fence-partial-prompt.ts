/**
 * The `# Emitting UI` block for chat surfaces rendered with Streamdown.
 *
 * On a chat surface the raw-JSONL output convention inverts: the reply is
 * Markdown, and UI entries are emitted inside a ```uifired fence so the
 * host's custom renderer can mount them. This partial explains exactly that
 * fence syntax — compose it after the core partials, which define the entry
 * format itself.
 */
export function getFencePartialPrompt(): string {
	return `# Emitting UI

You are replying in Markdown inside a chat. To render live UI, emit your JSONL component entries inside a fenced code block whose language token is exactly \`uifired\`:

\`\`\`uifired
{"key":"root","component":"...","children":["..."]}
{"key":"...","component":"..."}
\`\`\`

- The \`uifired\` language token is what routes the block to the UI renderer — with any other token the block shows as plain code.
- Inside the fence: one JSON object per line, exactly as specified above — no prose, no comments, no Markdown.
- Markdown prose before and after the fence is fine; use it to introduce or summarize, not to duplicate what the UI already shows.
- Each fence renders as an isolated block with its own state — one fence per reply unless the answer truly has independent parts.
- Never wrap ui-fired entries in any other fence language (\`json\`, \`jsonl\`, …) — those render as plain code, not UI.`;
}
