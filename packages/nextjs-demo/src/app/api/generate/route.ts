import { type ModelMessage, streamText } from "ai";
import { buildElementsById, streamJsonLines, type ComponentEntry } from "@ui-fired/core";
import {
  getCommonInstructionsPartialPrompt,
  getComponentsPartialPrompt,
  getEditRequestPrompt,
  getExpressionsPartialPrompt,
  getFunctionsPartialPrompt,
  getScopePartialPrompt,
} from "@ui-fired/core/prompt";
import { allDefinitions } from "@ui-fired/shadcn-catalog/defs";
import { allCommonEventSchemas } from "@ui-fired/shadcn-catalog/events";
import { asc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { componentEntries, pages } from "@/db/schema";
import { db } from "@/db";
import { domainTools } from "@/tools";

export const runtime = "nodejs";
export const maxDuration = 300;

// Plain string model ids resolve through the Vercel AI Gateway (set AI_GATEWAY_API_KEY).
const GENERATION_MODEL = process.env.AI_MODEL ?? "anthropic/claude-opus-4.8";
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

  const [page] = await db.select().from(pages).where(eq(pages.id, pageId));
  if (!page) return Response.json({ error: "Page not found" }, { status: 404 });

  const rows = await db
    .select({ data: componentEntries.data })
    .from(componentEntries)
    .where(eq(componentEntries.pageId, page.id))
    .orderBy(asc(componentEntries.id));

  // Edit mode replays the page's current JSONL as the model's own prior turn,
  // so the edit request reads as "modify your previous output". Children that
  // are referenced but were never emitted (a truncated earlier run) are listed
  // in the edit request so the model re-emits them instead of keeping them by
  // reference.
  const storedEntries = rows.map((row) => row.data as ComponentEntry);
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

  const system = [
    getCommonInstructionsPartialPrompt(),
    getScopePartialPrompt({ kind: "page" }),
    getExpressionsPartialPrompt(),
    getComponentsPartialPrompt({
      definitions: allDefinitions,
      commonEvents: allCommonEventSchemas,
    }),
    getFunctionsPartialPrompt({ functions: domainTools }),
  ].join("\n\n");

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      // Swallow enqueue failures: a client disconnect must not kill the run —
      // entries keep persisting to the DB and the prune below still executes.
      const send = (obj: unknown) => {
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(obj)}\n`));
        } catch {}
      };

      try {
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
          await db.insert(componentEntries).values({ pageId: page.id, data: value });
          send(value); // an entry streams as-is; control lines below carry a `type`
        }

        // Keep only the current tree in the DB: a re-emitted key shadows its old
        // row and replaced subtree at render time (buildElementsById); here the
        // shadowed rows are physically deleted so storage matches what renders.
        const stored = await db
          .select({ id: componentEntries.id, data: componentEntries.data })
          .from(componentEntries)
          .where(eq(componentEntries.pageId, page.id))
          .orderBy(asc(componentEntries.id));
        const current = buildElementsById(stored.map((row) => row.data as ComponentEntry));
        const lastIdByKey = new Map<string, number>();
        for (const row of stored) lastIdByKey.set((row.data as ComponentEntry).key, row.id);
        const keepIds = new Set(Object.keys(current).map((key) => lastIdByKey.get(key)));
        const staleIds = stored.map((row) => row.id).filter((id) => !keepIds.has(id));
        if (staleIds.length) {
          await db.delete(componentEntries).where(inArray(componentEntries.id, staleIds));
        }

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
