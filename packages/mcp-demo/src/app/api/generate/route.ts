import { type ModelMessage, streamText } from "ai";
import { buildElementsById, streamJsonLines, type ComponentEntry } from "@uicast/core";
import {
  getCommonInstructionsPartialPrompt,
  getComponentsPartialPrompt,
  getEditRequestPrompt,
  getExpressionsPartialPrompt,
  getFunctionsPartialPrompt,
  getScopePartialPrompt,
} from "@uicast/core/prompt";
import { allDefinitions } from "@uicast/shadcn-catalog/defs";
import { allCommonEventSchemas } from "@uicast/shadcn-catalog/events";
import { z } from "zod";
import { resolveRegistry, toPromptTools } from "@/mcp/registry";
import { type EntryRow, read, write } from "@/store";

export const runtime = "nodejs";
export const maxDuration = 300;

// Plain string model ids resolve through the Vercel AI Gateway (set AI_GATEWAY_API_KEY).
const GENERATION_MODEL = process.env.AI_MODEL ?? "anthropic/claude-opus-5";
// Providers default to a small output cap (Anthropic: 4096 tokens ≈ ~40
// entries), which truncates large pages mid-subtree. Set it explicitly.
const MAX_OUTPUT_TOKENS = Number(process.env.AI_MAX_OUTPUT_TOKENS ?? 32_000);

// The page row is created via POST /api/pages before generation. A page with
// no entries gets an initial generation; a page with entries gets an edit —
// its current entries are replayed as an assistant turn and the model emits
// only the delta (Partial Replacement semantics).
const generateInput = z.object({
  pageId: z.number().int(),
  prompt: z.string().min(1),
});

function isEntry(value: unknown): value is ComponentEntry {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as ComponentEntry).key === "string" &&
    typeof (value as ComponentEntry).component === "string"
  );
}

export async function POST(req: Request) {
  const parsed = generateInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues }, { status: 400 });
  }
  const { pageId, prompt } = parsed.data;

  const page = read().pages.find((row) => row.id === pageId);
  if (!page) return Response.json({ error: "Page not found" }, { status: 404 });

  const rows = read()
    .entries.filter((entry) => entry.pageId === page.id)
    .sort((a, b) => a.id - b.id);

  // Edit mode replays the page's current JSONL as the model's own prior turn,
  // so the edit request reads as "modify your previous output". Children that
  // are referenced but were never emitted (a truncated earlier run) are listed
  // in the edit request so the model re-emits them instead of keeping them by
  // reference.
  const storedEntries = rows.map((row) => row.data);
  const storedByKey = buildElementsById(storedEntries);
  const missingKeys = [
    ...new Set(
      Object.values(storedByKey)
        .flatMap((entry) => entry.children ?? [])
        .filter((key) => !storedByKey[key]),
    ),
  ];
  const messages: ModelMessage[] = rows.length
    ? [
        { role: "user", content: `Page title: ${page.title}\n\n${page.prompt ?? ""}` },
        { role: "assistant", content: rows.map((row) => JSON.stringify(row.data)).join("\n") },
        { role: "user", content: getEditRequestPrompt({ request: prompt, missingKeys }) },
      ]
    : [{ role: "user", content: `Page title: ${page.title}\n\n${prompt}` }];

  // The functions half of the prompt is entirely whatever MCP servers are
  // connected right now — there is no built-in domain in this app.
  const registry = await resolveRegistry();
  const system = [
    getCommonInstructionsPartialPrompt(),
    getScopePartialPrompt({ kind: "page" }),
    getExpressionsPartialPrompt(),
    getComponentsPartialPrompt({
      definitions: allDefinitions,
      commonEvents: allCommonEventSchemas,
    }),
    getFunctionsPartialPrompt({ functions: toPromptTools(registry) }),
  ].join("\n\n");

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      // Swallow enqueue failures: a client disconnect must not kill the run —
      // entries keep persisting and the prune below still executes.
      const send = (obj: unknown) => {
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(obj)}\n`));
        } catch {}
      };

      try {
        if (registry.failures.length) {
          send({
            type: "warning",
            warning: registry.failures
              .map((failure) => `${failure.serverName}: ${failure.error}`)
              .join("; "),
          });
        }

        let streamError: unknown = null;
        const result = streamText({
          model: GENERATION_MODEL,
          system,
          messages,
          maxOutputTokens: MAX_OUTPUT_TOKENS,
          onError: ({ error }) => {
            streamError = error;
          },
        });

        // Persist and relay each ComponentEntry the moment its line completes.
        for await (const value of streamJsonLines(result.textStream)) {
          if (!isEntry(value)) continue;
          write((data, id) => {
            const row: EntryRow = {
              id: id(),
              pageId: page.id,
              data: value,
              createdAt: Date.now(),
            };
            data.entries.push(row);
          });
          send(value); // an entry streams as-is; control lines below carry a `type`
        }

        // Keep only the current tree: a re-emitted key shadows its old row and
        // replaced subtree at render time (buildElementsById); here the shadowed
        // rows are physically dropped so storage matches what renders.
        write((data) => {
          const stored = data.entries
            .filter((entry) => entry.pageId === page.id)
            .sort((a, b) => a.id - b.id);
          const current = buildElementsById(stored.map((entry) => entry.data));
          const lastIdByKey = new Map<string, number>();
          for (const entry of stored) lastIdByKey.set(entry.data.key, entry.id);
          const keepIds = new Set(Object.keys(current).map((key) => lastIdByKey.get(key)));
          data.entries = data.entries.filter(
            (entry) => entry.pageId !== page.id || keepIds.has(entry.id),
          );
        });

        // "length" / "content-filter" here explains a stream that ends after only a few entries.
        const finishReason = await Promise.resolve(result.finishReason).catch(() => "unknown");
        if (streamError) {
          const message = streamError instanceof Error ? streamError.message : String(streamError);
          send({ type: "error", error: message });
        }
        send({ type: "done", pageId: page.id, finishReason });
      } catch (err) {
        send({ type: "error", error: err instanceof Error ? err.message : String(err) });
      } finally {
        try {
          controller.close();
        } catch {}
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
