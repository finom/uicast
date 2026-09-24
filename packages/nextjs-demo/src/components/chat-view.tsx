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
import { getErrorRecoveryPrompt } from "@uicast/core/prompt";
import { RendererProvider } from "@uicast/react";
import { type Usage, UsageLine } from "@/components/cost-info";
import { useRendererDefaults } from "@/components/renderer-defaults";
import { impls } from "@uicast/shadcn-catalog/all/impls";
import { createFenceRenderer } from "@uicast/streamdown";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput } from "@/components/ai-elements/prompt-input";
import { showToast, toastCallbackFailure } from "@/components/toaster";
import { evaluator } from "@/lib/evaluator";
import { setApiOwner } from "@/tools/http";

// Module scope: a new component identity per render would remount every UI block.
const uicastRenderer = createFenceRenderer({ showSourceToggle: true });

// Passing `plugins` replaces the default set, so the built-ins are recomposed.
const streamdownPlugins = { cjk, code, math, mermaid, renderers: [uicastRenderer] };

type ChatViewProps = { chatId: string; initialMessages?: UIMessage<Usage>[]; ownerSlug: string; readonly?: boolean };

export function ChatView({ chatId, initialMessages, ownerSlug, readonly = false }: ChatViewProps) {
  setApiOwner(ownerSlug);
  const { messages, sendMessage, status, stop, error } = useChat({ id: chatId, messages: initialMessages });
  const queryClient = useQueryClient();

  const busy = status === "streaming" || status === "submitted";
  const rendererDefaults = useRendererDefaults((failure) => {
    if (readonly) {
      showToast("Read-only chat — log in with OpenRouter to run recovery in your own copy.");
      return;
    }
    if (busy) return;
    sendMessage({ text: getErrorRecoveryPrompt({ failures: [failure] }) });
  });

  // The chat row is created server-side on the first message; refresh the sidebar when a run starts and when it settles.
  useEffect(() => {
    if (status === "streaming" || status === "ready") {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    }
  }, [status, queryClient]);

  const handleSubmit = (input: string) => {
    // Enter mid-stream must not inject a second message into an active run.
    if (busy) return;
    const text = input.trim();
    if (!text) return;
    if (messages.length === 0) {
      // Shallow: a router navigation would stop the stream into this mounted view.
      window.history.replaceState(null, "", `/u/${ownerSlug}/c/${chatId}`);
    }
    sendMessage({ text });
  };

  return (
    <RendererProvider
      onError={toastCallbackFailure}
      implementations={impls}
      evaluator={evaluator}
      fallbackComponents={rendererDefaults}
    >
      <div className="flex h-full flex-col">
        <Conversation className="flex-1">
          <ConversationContent className="mx-auto w-full max-w-3xl p-4">
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
                    {message.parts.map((part, index) => {
                      if (part.type !== "text") return null;
                      return message.role === "assistant" ? (
                        <MessageResponse key={index} plugins={streamdownPlugins}>
                          {part.text}
                        </MessageResponse>
                      ) : (
                        <span className="whitespace-pre-wrap" key={index}>
                          {part.text}
                        </span>
                      );
                    })}
                  </MessageContent>
                  {message.metadata && (
                    <UsageLine className="mt-1 justify-end text-[11px]" {...message.metadata} />
                  )}
                </Message>
              ))
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className="mx-auto w-full max-w-3xl px-4 pb-4">
          {error && <p className="pb-2 text-xs text-destructive">{error.message}</p>}

          {readonly ? (
            <p className="rounded-md border px-3 py-2 text-center text-xs text-muted-foreground">
              @{ownerSlug}'s chat — read-only.{" "}
              <a className="underline" href="/api/auth/login">
                Log in with OpenRouter
              </a>{" "}
              to start your own.
            </p>
          ) : (
            <PromptInput
              placeholder="e.g. How much did we earn this month?"
              status={status}
              onStop={stop}
              onSubmit={handleSubmit}
            />
          )}
        </div>
      </div>
    </RendererProvider>
  );
}
