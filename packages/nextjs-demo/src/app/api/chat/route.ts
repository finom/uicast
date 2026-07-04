import { convertToModelMessages, streamText, type UIMessage } from "ai";
import {
  getCommonInstructionsPartialPrompt,
  getComponentsPartialPrompt,
  getExpressionsPartialPrompt,
  getFunctionsPartialPrompt,
  getScopePartialPrompt,
} from "@ui-fired/core/prompt";
import { getFencePartialPrompt } from "@ui-fired/streamdown/prompt";
import { allDefinitions } from "@ui-fired/shadcn-catalog/defs";
import { allCommonEventSchemas } from "@ui-fired/shadcn-catalog/events";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { chatMessages, chats } from "@/db/schema";
import { db } from "@/db";
import { domainTools } from "@/tools";

export const runtime = "nodejs";
export const maxDuration = 300;

// Plain string model ids resolve through the Vercel AI Gateway (set AI_GATEWAY_API_KEY).
const CHAT_MODEL = process.env.AI_MODEL ?? "anthropic/claude-opus-4.8";
const MAX_OUTPUT_TOKENS = Number(process.env.AI_MAX_OUTPUT_TOKENS ?? 32_000);

// The message array is the AI SDK's UIMessage shape — validated loosely here,
// trusted structurally (it round-trips through useChat).
const chatInput = z.object({
  id: z.string().min(1),
  messages: z.array(z.looseObject({ id: z.string(), role: z.string() })).min(1),
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
// list, so mirroring it wholesale is simpler and self-healing.
async function persistMessages(chatId: string, messages: UIMessage[]) {
  await db.delete(chatMessages).where(eq(chatMessages.chatId, chatId));
  if (messages.length === 0) return;
  await db.insert(chatMessages).values(
    messages.map((message) => ({
      chatId,
      messageId: message.id,
      role: message.role,
      parts: message.parts,
    })),
  );
}

export async function POST(req: Request) {
  const parsed = chatInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues }, { status: 400 });
  }
  const { id } = parsed.data;
  const uiMessages = parsed.data.messages as unknown as UIMessage[];

  // The chat row is created lazily by the first message (the client mints the
  // uuid), titled from that message's text.
  const title = firstUserText(uiMessages).slice(0, 60) || "New chat";
  await db.insert(chats).values({ id, title }).onConflictDoNothing();
  await persistMessages(id, uiMessages);

  const system = [
    getCommonInstructionsPartialPrompt(),
    getScopePartialPrompt({ kind: "answer" }),
    getExpressionsPartialPrompt(),
    getComponentsPartialPrompt({
      definitions: allDefinitions,
      commonEvents: allCommonEventSchemas,
    }),
    getFunctionsPartialPrompt({ functions: domainTools }),
    getFencePartialPrompt(),
  ].join("\n\n");

  const result = streamText({
    model: CHAT_MODEL,
    system,
    messages: await convertToModelMessages(uiMessages),
    maxOutputTokens: MAX_OUTPUT_TOKENS,
  });

  return result.toUIMessageStreamResponse({
    originalMessages: uiMessages,
    generateMessageId: () => crypto.randomUUID(),
    onEnd: async ({ messages }) => {
      await persistMessages(id, messages);
    },
  });
}
