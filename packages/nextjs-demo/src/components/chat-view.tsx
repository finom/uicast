"use client";

import { useChat } from "@ai-sdk/react";
import { useQueryClient } from "@tanstack/react-query";
import { cjk } from "@streamdown/cjk";
import { code } from "@streamdown/code";
import { math } from "@streamdown/math";
import { mermaid } from "@streamdown/mermaid";
import type { UIMessage } from "ai";
import { MessageSquare } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { getErrorRecoveryPrompt } from "@uicast/core/prompt";
import { Evaluator } from "@uicast/expr";
import { type ErrorComponentProps, RendererProvider } from "@uicast/react";
import { ConfirmModal } from "@uicast/shadcn-catalog/fallback-components";
import { CostInfo } from "@/components/cost-info";
import { RecoverableRenderError } from "@/components/recoverable-render-error";
import { allImplementations } from "@uicast/shadcn-catalog/impls";
import { createFenceRenderer } from "@uicast/streamdown";
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
import { showToast } from "@/components/toaster";
import { domainTools } from "@/tools";

// One evaluator for the app: the host functions bind on it, and it holds the parse cache.
const evaluator = new Evaluator({ functions: domainTools });
import { setApiOwner } from "@/tools/http";

// Module scope: the renderer's component identity must stay stable across
// streaming re-renders, or every update would remount the mounted UI blocks.
const uicastRenderer = createFenceRenderer({ showSourceToggle: true });

// MessageResponse's default plugin set plus the ```uicast custom renderer —
// passing `plugins` replaces the default, so the built-ins are recomposed.
const streamdownPlugins = { cjk, code, math, mermaid, renderers: [uicastRenderer] };

export function ChatView({
  chatId,
  initialMessages,
  replaceUrlOnFirstSend = false,
  ownerSlug = null,
  readonly = false,
}: {
  chatId: string;
  initialMessages?: UIMessage[];
  replaceUrlOnFirstSend?: boolean;
  ownerSlug?: string | null;
  readonly?: boolean;
}) {
  setApiOwner(ownerSlug);
  const { messages, sendMessage, status, stop, error } = useChat({
    id: chatId,
    messages: initialMessages,
  });
  const queryClient = useQueryClient();

  // User-triggered error recovery: the error slot's Recover button reports the
  // failed element as a chat message, and the model replies with a corrected
  // fence. Refs keep `rendererDefaults` referentially stable (a new identity
  // would remount every mounted UI block) while the handlers stay fresh.
  const sendMessageRef = useRef(sendMessage);
  sendMessageRef.current = sendMessage;
  const statusRef = useRef(status);
  statusRef.current = status;
  const rendererDefaults = useMemo(
    () => ({
      confirm: ConfirmModal,
      error: ({ error: renderError, elementKey }: ErrorComponentProps) => (
        <RecoverableRenderError
          error={renderError}
          elementKey={elementKey}
          onRecover={
            elementKey
              ? () => {
                  if (readonly) {
                    showToast("Read-only chat — log in with OpenRouter to run recovery in your own copy.");
                    return;
                  }
                  if (statusRef.current === "streaming" || statusRef.current === "submitted")
                    return;
                  sendMessageRef.current({
                    text: getErrorRecoveryPrompt({
                      failures: [{ key: elementKey, message: renderError.message }],
                    }),
                  });
                }
              : undefined
          }
        />
      ),
    }),
    [readonly],
  );

  // The chat row is created (and titled) server-side on the first message —
  // refresh the sidebar as soon as a run starts and again when it settles.
  useEffect(() => {
    if (status === "streaming" || status === "ready") {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    }
  }, [status, queryClient]);

  const handleSubmit = (message: PromptInputMessage) => {
    // Enter mid-stream must not inject a second message into an active run.
    if (statusRef.current === "streaming" || statusRef.current === "submitted") return;
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
    <RendererProvider
        onError={(error) => {
          // Callback failures (a rejected write, a tool error) have no error
          // slot — flash the server's own message instead.
          if (error.reason === "host-function" || error.reason === "invalid-arguments") {
            showToast(error.message.replace(/^[^:]*: */, ""));
          }
        }}
      implementations={allImplementations}
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
                  {(() => {
                    const meta = message.metadata as
                      | {
                          inputTokens?: number;
                          outputTokens?: number;
                          costUsd?: number | null;
                          model?: string;
                        }
                      | undefined;
                    if (!meta || meta.inputTokens === undefined) return null;
                    const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));
                    return (
                      <p className="mt-1 flex items-center justify-end gap-1.5 text-right text-[11px] text-muted-foreground">
                        <span>
                          {fmt(meta.inputTokens ?? 0)} in · {fmt(meta.outputTokens ?? 0)} out
                          {typeof meta.costUsd === "number" ? ` · ≈$${meta.costUsd.toFixed(3)}` : ""}
                        </span>
                        {meta.model ? <CostInfo model={meta.model} /> : null}
                      </p>
                    );
                  })()}
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
            {ownerSlug ? `@${ownerSlug}'s chat — read-only. ` : "Read-only chat. "}
            <a className="underline" href="/api/auth/login">
              Log in with OpenRouter
            </a>{" "}
            to start your own.
          </p>
        ) : (
          <PromptInput onSubmit={handleSubmit}>
            <PromptInputBody>
              <PromptInputTextarea placeholder="e.g. How much did we earn this month?" />
            </PromptInputBody>
            <PromptInputFooter>
              <PromptInputTools />
              <PromptInputSubmit status={status} onStop={stop} />
            </PromptInputFooter>
            </PromptInput>
          )}
        </div>
      </div>
    </RendererProvider>
  );
}
