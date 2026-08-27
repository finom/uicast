# uicast MCP demo

A uicast app whose **entire domain comes from MCP servers you connect at runtime** — it ships no database and no built-in tools. Connect a server on the MCPs screen and every tool it publishes becomes a host function: it appears in the system prompt for pages and chats, and generated documents call it live.

The seam is one wrapper: an MCP tool already carries a name, a description, and JSON Schemas, so converting it to the `StandardToolV0` uicast consumes (`src/mcp/standard-tool.ts`) is a pass-through, not a translation. That is the demo's point.

## Run

```bash
npm install                                # repo root
npm run dev -w @uicast/mcp-demo
```

Put `AI_GATEWAY_API_KEY` in `packages/mcp-demo/.env.local` (plain model ids resolve through the Vercel AI Gateway). Optional: `AI_MODEL`, `AI_MAX_OUTPUT_TOKENS`.

Then open **MCPs** in the sidebar and connect a Streamable HTTP server. Servers that take a static credential get it as a header (`{ "Authorization": "Bearer …" }`); it is stored in `data/store.json` and never leaves the Next.js server — the browser calls tools through `/api/mcp/call`.

## How it hangs together

- `src/mcp/client.ts` — the MCP client (`@modelcontextprotocol/sdk`), server-side only, one cached connection per server.
- `src/mcp/standard-tool.ts` — MCP tool → `StandardToolV0`. Tool names are made identifier-safe and server-prefixed (`linear_search_issues`), because expressions call functions as bare identifiers and two servers may both expose `search`.
- `src/mcp/registry.ts` — every connected server's tools, resolved in parallel; an unreachable server degrades to a warning instead of taking the rest down.
- `/api/mcp/call` — the browser's proxy for tool calls, so credentials stay server-side.
- Pages and chats are the same surfaces as `nextjs-demo`, minus the warehouse; persistence is one JSON file (`src/store.ts`).

A tool with no `outputSchema` is advertised to the model as returning `unknown` — callable for its effect, not readable field-by-field. The MCPs screen shows which tools declare their output, because that is what predicts whether the model can build UI *from* their data.
