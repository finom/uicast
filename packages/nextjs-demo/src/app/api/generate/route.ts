import { type ModelMessage, streamText } from "ai";
import { buildElementsByKey, isComponentEntry, streamJsonLines } from "@uicast/core";
import { getEditRequestPrompt } from "@uicast/core/prompt";
import { asc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { componentEntries, pages } from "@/db/schema";
import { db } from "@/db";
import { requireUser } from "@/lib/api";
import { MAX_OUTPUT_TOKENS, modelForUser } from "@/lib/openrouter";
import { buildPageSystemPrompt } from "@/lib/page-system-prompt";
import { computeCostUsd, getModelPricing } from "@/lib/pricing";

export const maxDuration = 300;

// A page with entries gets an edit: its entries are replayed as an assistant turn and the model emits only the delta.
const generateInput = z.object({
  pageId: z.number().int(),
  prompt: z.string().min(1),
});

export async function POST(req: Request) {
  const parsed = generateInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues }, { status: 400 });
  }
  const { pageId, prompt } = parsed.data;

  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const model = modelForUser(auth.me);
  if (!model) {
    return Response.json(
      { error: "No OpenRouter key on this account — log in again to grant one." },
      { status: 403 },
    );
  }

  const [page] = await db.select().from(pages).where(eq(pages.id, pageId));
  if (!page) return Response.json({ error: "Page not found" }, { status: 404 });
  if (page.userId !== auth.me.id) {
    return Response.json({ error: "This page belongs to another user." }, { status: 403 });
  }

  const rows = await db
    .select({ data: componentEntries.data })
    .from(componentEntries)
    .where(eq(componentEntries.pageId, page.id))
    .orderBy(asc(componentEntries.id));

  // Children referenced but never emitted (a truncated run) are listed, so the model re-emits them.
  const storedByKey = buildElementsByKey(rows.map((row) => row.data));
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

  const system = buildPageSystemPrompt();

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      // A client disconnect must not kill the run: entries keep persisting and the prune still executes.
      const send = (obj: unknown) => {
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(obj)}\n`));
        } catch {}
      };

      try {
        let streamError: unknown = null;
        const result = streamText({
          model,
          system,
          messages,
          maxOutputTokens: MAX_OUTPUT_TOKENS,
          onError: ({ error }) => {
            streamError = error;
          },
        });

        for await (const value of streamJsonLines(result.textStream)) {
          if (!isComponentEntry(value)) continue;
          await db.insert(componentEntries).values({ pageId: page.id, data: value });
          send(value); // an entry streams as-is; control lines below carry a `type`
        }

        // Rows a re-emitted key shadows are deleted, so storage matches what renders.
        const stored = await db
          .select({ id: componentEntries.id, data: componentEntries.data })
          .from(componentEntries)
          .where(eq(componentEntries.pageId, page.id))
          .orderBy(asc(componentEntries.id));
        const current = buildElementsByKey(stored.map((row) => row.data));
        const lastIdByKey = new Map<string, number>();
        for (const row of stored) lastIdByKey.set(row.data.key, row.id);
        const keepIds = new Set(Object.keys(current).map((key) => lastIdByKey.get(key)));
        const staleIds = stored.map((row) => row.id).filter((id) => !keepIds.has(id));
        if (staleIds.length) {
          await db.delete(componentEntries).where(inArray(componentEntries.id, staleIds));
        }

        // An estimate: OpenRouter's invoice is authoritative. Billing must not fail a finished run.
        try {
          const [usage, pricing] = await Promise.all([result.usage, getModelPricing()]);
          const inputTokens = usage.inputTokens ?? 0;
          const outputTokens = usage.outputTokens ?? 0;
          const costUsd = computeCostUsd(pricing, inputTokens, outputTokens);
          await db
            .update(pages)
            .set({
              inputTokens: sql`${pages.inputTokens} + ${inputTokens}`,
              outputTokens: sql`${pages.outputTokens} + ${outputTokens}`,
              costUsd: sql`${pages.costUsd} + ${costUsd ?? 0}`,
            })
            .where(eq(pages.id, page.id));
          send({ type: "usage", inputTokens, outputTokens, costUsd });
        } catch {}

        // "length" / "content-filter" here explains a stream that ends after only a few entries.
        const finishReason = await Promise.resolve(result.finishReason).catch(() => "unknown");
        if (streamError) {
          const message = streamError instanceof Error ? streamError.message : String(streamError);
          send({ type: "error", error: message });
        }
        send({ type: "done", finishReason });
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
