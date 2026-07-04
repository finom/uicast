"use client";

import { useChat } from "@ai-sdk/react";
import { useQueryClient } from "@tanstack/react-query";
import { cjk } from "@streamdown/cjk";
import { code } from "@streamdown/code";
import { math } from "@streamdown/math";
import { mermaid } from "@streamdown/mermaid";
import type { UIMessage } from "ai";
import { MessageSquare } from "lucide-react";
import { useEffect } from "react";
import { RendererConfigProvider } from "@ui-fired/react";
import {
  ConfirmModal,
  RenderError,
  UnknownComponent,
} from "@ui-fired/shadcn-catalog/default-components";
import { allImplementations } from "@ui-fired/shadcn-catalog/impls";
import { createFenceRenderer } from "@ui-fired/streamdown";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  type PromptInputMessage,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { domainTools } from "@/tools";

// Module scope: the renderer's component identity must stay stable across
// streaming re-renders, or every update would remount the mounted UI blocks.
const uifiredRenderer = createFenceRenderer({
  implementations: allImplementations,
  functions: domainTools,
  showSourceToggle: true,
});

// MessageResponse's default plugin set plus the ```uifired custom renderer —
// passing `plugins` replaces the default, so the built-ins are recomposed.
const streamdownPlugins = { cjk, code, math, mermaid, renderers: [uifiredRenderer] };

const rendererDefaults = {
  confirm: ConfirmModal,
  unknown: UnknownComponent,
  error: RenderError,
};

export function ChatView({
  chatId,
  initialMessages,
  replaceUrlOnFirstSend = false,
}: {
  chatId: string;
  initialMessages?: UIMessage[];
  replaceUrlOnFirstSend?: boolean;
}) {
  const { messages, sendMessage, status, stop, error } = useChat({
    id: chatId,
    messages: initialMessages,
  });
  const queryClient = useQueryClient();

  // The chat row is created (and titled) server-side on the first message —
  // refresh the sidebar as soon as a run starts and again when it settles.
  useEffect(() => {
    if (status === "streaming" || status === "ready") {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    }
  }, [status, queryClient]);

  const handleSubmit = (message: PromptInputMessage) => {
    const text = message.text.trim();
    if (!text) return;
    if (replaceUrlOnFirstSend && messages.length === 0) {
      // Shallow URL swap: the stream must keep flowing into this mounted
      // view, so no router navigation until the user leaves on their own.
      window.history.replaceState(null, "", `/chats/${chatId}`);
    }
    sendMessage({ text });
  };

  return (
    <RendererConfigProvider defaultComponents={rendererDefaults}>
      <div className="mx-auto flex h-full max-w-3xl flex-col p-4">
        <Conversation className="flex-1">
          <ConversationContent>
            {messages.length === 0 ? (
              <ConversationEmptyState
                icon={<MessageSquare className="size-8" />}
                title="Ask about your data"
                description="Answers can include live UI — charts, tables, and stats bound to the demo database."
              />
            ) : (
              messages.map((message) => (
                <Message from={message.role} key={message.id}>
                  <MessageContent>
                    {message.parts.map((part, index) =>
                      part.type === "text" ? (
                        message.role === "assistant" ? (
                          <MessageResponse key={index} plugins={streamdownPlugins}>
                            {part.text}
                          </MessageResponse>
                        ) : (
                          <span className="whitespace-pre-wrap" key={index}>
                            {part.text}
                          </span>
                        )
                      ) : null,
                    )}
                  </MessageContent>
                </Message>
              ))
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        {error && <p className="pb-2 text-xs text-destructive">{error.message}</p>}

        <PromptInput onSubmit={handleSubmit}>
          <PromptInputBody>
            <PromptInputTextarea placeholder="e.g. How much did we earn this month?" />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputTools />
            <PromptInputSubmit status={status} onStop={stop} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </RendererConfigProvider>
  );
}
