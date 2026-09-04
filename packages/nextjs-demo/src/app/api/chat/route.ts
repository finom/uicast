import { convertToModelMessages, createUIMessageStreamResponse, streamText, toUIMessageStream, type UIMessage } from "ai";
import {
  getCommonInstructionsPartialPrompt,
  getComponentsPartialPrompt,
  getFunctionsPartialPrompt,
  getExpressionsPartialPrompt,
  getScopePartialPrompt,
} from "@uicast/core/prompt";
import { getFencePartialPrompt } from "@uicast/streamdown/prompt";
import { defs } from "@uicast/shadcn-catalog/all-defs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { chatMessages, chats } from "@/db/schema";
import { db } from "@/db";
import { requireUser } from "@/lib/api";
import { GENERATION_MODEL, MAX_OUTPUT_TOKENS, modelForUser } from "@/lib/openrouter";
import { computeCostUsd, getModelPricing } from "@/lib/pricing";
import { domainTools } from "@/tools";

export const runtime = "nodejs";
export const maxDuration = 300;

// The message array is the AI SDK's UIMessage shape — only the fields this
// route reads (id / role / parts, and text on text parts) are validated; the
// rest rides along loosely (it round-trips through useChat).
const chatInput = z.object({
  id: z.string().min(1),
  messages: z
    .array(
      z.looseObject({
        id: z.string(),
        role: z.string(),
        parts: z.array(
          z
            .looseObject({ type: z.string(), text: z.string().optional() })
            .refine((part) => part.type !== "text" || part.text !== undefined, {
              error: "text parts require a text string",
            }),
        ),
      }),
    )
    .min(1),
});

function firstUserText(messages: UIMessage[]): string {
  const user = messages.find((message) => message.role === "user");
  const textPart = user?.parts.find(
    (part): part is Extract<UIMessage["parts"][number], { type: "text" }> =>
      part.type === "text",
  );
  return textPart?.text.trim() ?? "";
}

// Replace-all persistence: the incoming array is the client's full message
// list, so mirroring it wholesale is simpler and self-healing. The delete and
// reinsert ride one transaction so a failed insert can't leave the chat empty.
async function persistMessages(chatId: string, messages: UIMessage[]) {
  await db.transaction(async (tx) => {
    await tx.delete(chatMessages).where(eq(chatMessages.chatId, chatId));
    if (messages.length === 0) return;
    await tx.insert(chatMessages).values(
      messages.map((message) => ({
        chatId,
        messageId: message.id,
        role: message.role,
        parts: message.parts,
        metadata: (message as { metadata?: unknown }).metadata ?? null,
      })),
    );
  });
}

export async function POST(req: Request) {
  const parsed = chatInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues }, { status: 400 });
  }
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const model = modelForUser(auth.me);
  if (!model) {
    return Response.json(
      { error: "No OpenRouter key on this account — log in again to grant one." },
      { status: 403 },
    );
  }
  const { id } = parsed.data;
  const uiMessages = parsed.data.messages as unknown as UIMessage[];

  // The chat row is created lazily by the first message (the client mints the
  // uuid), titled from that message's text. Continuing someone else's chat is
  // refused — everything is readable, only the owner writes.
  const [existing] = await db.select().from(chats).where(eq(chats.id, id));
  if (existing && existing.userId !== auth.me.id) {
    return Response.json({ error: "This chat belongs to another user." }, { status: 403 });
  }
  if (!existing) {
    const title = firstUserText(uiMessages).slice(0, 60) || "New chat";
    await db.insert(chats).values({ id, userId: auth.me.id, title }).onConflictDoNothing();
  }
  await persistMessages(id, uiMessages);

  const system = [
    getCommonInstructionsPartialPrompt(),
    getScopePartialPrompt({ kind: "answer" }),
    getComponentsPartialPrompt({
      definitions: defs,
    }),
    getFunctionsPartialPrompt({ functions: domainTools }),
    getExpressionsPartialPrompt(),
    getFencePartialPrompt(),
  ].join("\n\n");

  // Prefetched so the metadata callback can price the finish synchronously.
  const pricing = await getModelPricing();

  const result = streamText({
    model,
    system,
    messages: await convertToModelMessages(uiMessages),
    maxOutputTokens: MAX_OUTPUT_TOKENS,
  });

  const stream = toUIMessageStream({
    stream: result.stream,
    originalMessages: uiMessages,
    generateMessageId: () => crypto.randomUUID(),
    // Every assistant message carries its own bill.
    messageMetadata: ({ part }) => {
      if (part.type !== "finish") return undefined;
      const inputTokens = part.totalUsage.inputTokens ?? 0;
      const outputTokens = part.totalUsage.outputTokens ?? 0;
      return {
        inputTokens,
        outputTokens,
        costUsd: computeCostUsd(pricing, inputTokens, outputTokens),
        model: GENERATION_MODEL,
      };
    },
    onFinish: async ({ messages }) => {
      await persistMessages(id, messages);
    },
  });
  return createUIMessageStreamResponse({ stream });
}
