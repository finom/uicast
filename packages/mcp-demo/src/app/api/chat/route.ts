import { convertToModelMessages, streamText, type UIMessage } from "ai";
import {
  getCommonInstructionsPartialPrompt,
  getComponentsPartialPrompt,
  getExpressionsPartialPrompt,
  getFunctionsPartialPrompt,
  getScopePartialPrompt,
} from "@uicast/core/prompt";
import { getFencePartialPrompt } from "@uicast/streamdown/prompt";
import { allDefinitions } from "@uicast/shadcn-catalog/defs";
import { allCommonEventSchemas } from "@uicast/shadcn-catalog/events";
import { z } from "zod";
import { resolveRegistry, toPromptTools } from "@/mcp/registry";
import { type ChatRow, type MessageRow, write } from "@/store";

export const runtime = "nodejs";
export const maxDuration = 300;

// Plain string model ids resolve through the Vercel AI Gateway (set AI_GATEWAY_API_KEY).
const CHAT_MODEL = process.env.AI_MODEL ?? "anthropic/claude-opus-5";
const MAX_OUTPUT_TOKENS = Number(process.env.AI_MAX_OUTPUT_TOKENS ?? 32_000);

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
// list, so mirroring it wholesale is simpler and self-healing.
function persistMessages(chatId: string, messages: UIMessage[]) {
  write((data, id) => {
    data.messages = data.messages.filter((message) => message.chatId !== chatId);
    for (const message of messages) {
      const row: MessageRow = {
        id: id(),
        chatId,
        messageId: message.id,
        role: message.role,
        parts: message.parts,
        createdAt: Date.now(),
      };
      data.messages.push(row);
    }
  });
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
  write((data) => {
    if (data.chats.some((chat) => chat.id === id)) return;
    const chat: ChatRow = { id, title, createdAt: Date.now() };
    data.chats.push(chat);
  });
  persistMessages(id, uiMessages);

  const system = [
    getCommonInstructionsPartialPrompt(),
    getScopePartialPrompt({ kind: "answer" }),
    getExpressionsPartialPrompt(),
    getComponentsPartialPrompt({
      definitions: allDefinitions,
      commonEvents: allCommonEventSchemas,
    }),
    getFunctionsPartialPrompt({ functions: toPromptTools(await resolveRegistry()) }),
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
      persistMessages(id, messages);
    },
  });
}
