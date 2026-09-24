import { convertToModelMessages, createUIMessageStreamResponse, isTextUIPart, streamText, toUIMessageStream, type UIMessage } from "ai";
import { getFencePartialPrompt } from "@uicast/streamdown/prompt";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { chatMessages, chats } from "@/db/schema";
import { db } from "@/db";
import { requireUser } from "@/lib/api";
import { GENERATION_MODEL, MAX_OUTPUT_TOKENS, modelForUser } from "@/lib/openrouter";
import { computeCostUsd, getModelPricing } from "@/lib/pricing";
import { buildSystemPrompt } from "@/lib/system-prompt";

export const maxDuration = 300;

// Only the fields this route reads are validated; the rest round-trips through useChat.
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
  return user?.parts.find(isTextUIPart)?.text.trim() ?? "";
}

// The incoming array is the client's full list. Delete and reinsert ride one transaction, so a failed insert cannot leave the chat empty.
async function persistMessages(chatId: string, messages: UIMessage[]) {
  await db.transaction(async (tx) => {
    await tx.delete(chatMessages).where(eq(chatMessages.chatId, chatId));
    await tx.insert(chatMessages).values(
      messages.map((message) => {
        const { model = null, ...usage } = (message.metadata ?? {}) as { model?: string | null };
        return {
          chatId,
          messageId: message.id,
          role: message.role,
          parts: message.parts,
          metadata: message.metadata ? usage : null,
          model,
        };
      }),
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

  // The client mints the id, so the row is created by the first message. Only the owner writes.
  const [existing] = await db.select().from(chats).where(eq(chats.id, id));
  if (existing && existing.userId !== auth.me.id) {
    return Response.json({ error: "This chat belongs to another user." }, { status: 403 });
  }
  if (!existing) {
    const title = firstUserText(uiMessages).slice(0, 60) || "New chat";
    await db.insert(chats).values({ id, userId: auth.me.id, title }).onConflictDoNothing();
  }
  await persistMessages(id, uiMessages);

  // Prefetched so the metadata callback can price the finish synchronously.
  const pricing = await getModelPricing();

  const result = streamText({
    model,
    system: buildSystemPrompt("answer", getFencePartialPrompt()),
    messages: await convertToModelMessages(uiMessages),
    maxOutputTokens: MAX_OUTPUT_TOKENS,
  });

  const stream = toUIMessageStream({
    stream: result.stream,
    originalMessages: uiMessages,
    generateMessageId: () => crypto.randomUUID(),
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
