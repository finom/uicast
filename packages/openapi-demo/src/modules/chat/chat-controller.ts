import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { getFencePartialPrompt } from "@uicast/streamdown/prompt";
import { get, operation, post, prefix, procedure, type VovkRequest } from "vovk";
import { z } from "zod";
import { buildSystemPrompt } from "@/connections/system-prompt";
import ChatService from "./chat-service";

// Plain string model ids resolve through the Vercel AI Gateway (set AI_GATEWAY_API_KEY).
const CHAT_MODEL = process.env.AI_MODEL ?? "anthropic/claude-opus-5";
const MAX_OUTPUT_TOKENS = Number(process.env.AI_MAX_OUTPUT_TOKENS ?? 32_000);

function firstUserText(messages: UIMessage[]): string {
  const user = messages.find((message) => message.role === "user");
  const part = user?.parts.find(
    (candidate): candidate is Extract<UIMessage["parts"][number], { type: "text" }> =>
      candidate.type === "text",
  );
  return part?.text.trim() ?? "";
}

@prefix("chat")
export default class ChatController {
  @operation({ summary: "List chats" })
  @get()
  static getChats = procedure({
    output: z.array(z.object({ id: z.string(), title: z.string(), createdAt: z.string() })),
  }).handle(() => ChatService.getChats());

  @operation({
    summary: "Send a message",
    description:
      "Streams the assistant's reply as an AI SDK UI message stream. The reply may contain `uicast` fences, whose functions are the operations of every connected API.",
  })
  @post("messages")
  static async sendMessage(req: VovkRequest<{ id: string; messages: UIMessage[] }>) {
    const { id, messages } = await req.json();

    await ChatService.ensureChat(id, firstUserText(messages).slice(0, 60) || "New chat");
    ChatService.persistMessages(id, messages);

    const system = await buildSystemPrompt({
      scopeKind: "answer",
      extra: [getFencePartialPrompt()],
    });

    const result = streamText({
      model: CHAT_MODEL,
      system,
      messages: await convertToModelMessages(messages),
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    });

    // A Vovk handler may return any Response, which is what lets the streaming
    // endpoints be ordinary controllers rather than hand-written route files.
    // `result.toUIMessageStreamResponse()` is deprecated in favour of these two
    // standalone helpers over `result.stream`.
    return createUIMessageStreamResponse({
      stream: toUIMessageStream({
        stream: result.stream,
        originalMessages: messages,
        generateMessageId: () => crypto.randomUUID(),
        onEnd: ({ messages: finished }) => ChatService.persistMessages(id, finished),
      }),
    });
  }
}
