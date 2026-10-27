"use client";

import { useChat } from "@ai-sdk/react";
import { useQueryClient } from "@tanstack/react-query";
import { cjk } from "@streamdown/cjk";
import { code } from "@streamdown/code";
import { math } from "@streamdown/math";
import { mermaid } from "@streamdown/mermaid";
import {
  type DynamicToolUIPart,
  getToolName,
  isToolUIPart,
  lastAssistantMessageIsCompleteWithToolCalls,
  type ToolUIPart,
  type UIMessage,
} from "ai";
import { Code, LoaderCircle, MessageSquare } from "lucide-react";
import { type RefObject, useEffect, useRef, useState } from "react";
import { getErrorRecoveryPrompt } from "@uicast/core/prompt";
import type { ExprToolOutput } from "@uicast/core/tool";
import { RendererProvider, useExprTool } from "@uicast/react";
import { type Usage, UsageLine } from "@/components/cost-info";
import { useRendererDefaults } from "@/components/renderer-defaults";
import { impls } from "@uicast/shadcn-catalog/all/impls";
import { Button } from "@uicast/shadcn-catalog/ui/button";
import { Toggle } from "@uicast/shadcn-catalog/ui/toggle";
import { createFenceRenderer, type SourceToggleProps } from "@uicast/streamdown";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput } from "@/components/ai-elements/prompt-input";
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from "@/components/ai-elements/tool";
import { showToast, toastCallbackFailure } from "@/components/toaster";
import { evaluator } from "@/lib/evaluator";
import { pickChatSuggestions } from "@/lib/suggestions";
import { cn } from "@/lib/utils";
import { setApiOwner } from "@/tools/http";

// The chat route answers `{ error }` JSON, and useChat hands over the raw body.
const errorText = (message: string) => {
  try {
    const { error } = JSON.parse(message);
    return typeof error === "string" ? error : message;
  } catch {
    return message;
  }
};

// Example requests; a click sends one as the user's message.
function Suggestions({
  items,
  onPick,
  className,
}: {
  items: string[];
  onPick: (text: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {items.map((text) => (
        <Button key={text} variant="outline" onClick={() => onPick(text)}>
          {text}
        </Button>
      ))}
    </div>
  );
}

const hasText = (message: UIMessage) => message.parts.some((part) => part.type === "text" && part.text);
const hasContent = (message: UIMessage) => hasText(message) || message.parts.some(isToolUIPart);

// The expr tool answers a declined confirm and a failed step as output; the card shows them as denied and as an error.
const toolView = (part: ToolUIPart | DynamicToolUIPart) => {
  const output =
    getToolName(part) === "expr" && part.state === "output-available" ? (part.output as ExprToolOutput) : null;
  if (output && "declined" in output) return { state: "output-denied" as const, output, errorText: undefined };
  if (output && "error" in output) {
    const { reason, message } = output.error;
    return { state: "output-error" as const, output: undefined, errorText: `${reason}: ${message}` };
  }
  return { state: part.state, output: part.output, errorText: part.errorText };
};

function ToolCall({ part }: { part: ToolUIPart | DynamicToolUIPart }) {
  const { state, output, errorText } = toolView(part);
  return (
    <Tool defaultOpen={state === "output-error"}>
      <ToolHeader title={getToolName(part)} type={part.type} state={state} />
      <ToolContent>
        <ToolInput input={part.input} />
        <ToolOutput output={output} errorText={errorText} />
      </ToolContent>
    </Tool>
  );
}

function SourceToggle({ showSource, onShowSourceChange }: SourceToggleProps) {
  return (
    <Toggle size="sm" className="mb-1 ml-auto flex" pressed={showSource} onPressedChange={onShowSourceChange}>
      <Code /> Source
    </Toggle>
  );
}

// Module scope: a new component identity per render would remount every UI block.
const uicastRenderer = createFenceRenderer({ sourceToggle: SourceToggle });

// Passing `plugins` replaces the default set, so the built-ins are recomposed.
const streamdownPlugins = { cjk, code, math, mermaid, renderers: [uicastRenderer] };

type RunExprTool = (input: unknown) => Promise<ExprToolOutput>;

// `useExprTool` needs the provider, which sits below `useChat`: this hands its runner up.
function ExprToolBridge({ runner }: { runner: RefObject<RunExprTool | null> }) {
  const run = useExprTool();
  useEffect(() => {
    runner.current = run;
  }, [run, runner]);
  return null;
}

type ChatViewProps = {
  chatId: string;
  initialMessages?: UIMessage<Usage>[];
  ownerSlug: string;
  readonly?: boolean;
  suggestions?: string[];
};

export function ChatView({ chatId, initialMessages, ownerSlug, readonly = false, suggestions }: ChatViewProps) {
  setApiOwner(ownerSlug);
  const runExprTool = useRef<RunExprTool | null>(null);
  const { messages, sendMessage, addToolOutput, status, stop, error } = useChat({
    id: chatId,
    messages: initialMessages,
    // The model acts on the UI through the `expr` tool; its answer goes back without a new user message.
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    onToolCall: ({ toolCall }) => {
      const run = runExprTool.current;
      if (toolCall.toolName !== "expr" || !run) return;
      run(toolCall.input).then((output) => addToolOutput({ tool: "expr", toolCallId: toolCall.toolCallId, output }));
    },
  });
  const queryClient = useQueryClient();
  // The server picks the first set; each send picks the set shown under its answer.
  const [picks, setPicks] = useState(suggestions);

  const busy = status === "streaming" || status === "submitted";
  const last = messages.at(-1);
  // From the send until the answer's first text arrives.
  const waiting = busy && !(last?.role === "assistant" && hasText(last));
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
    const asked = messages
      .flatMap((m) => (m.role === "user" ? m.parts : []))
      .flatMap((p) => (p.type === "text" ? [p.text] : []));
    setPicks(pickChatSuggestions([...asked, text]));
    sendMessage({ text });
  };

  return (
    <RendererProvider
      onError={toastCallbackFailure}
      implementations={impls}
      evaluator={evaluator}
      fallbackComponents={rendererDefaults}
    >
      <ExprToolBridge runner={runExprTool} />
      <div className="flex h-full flex-col">
        <Conversation className="flex-1">
          <ConversationContent className="mx-auto min-h-full w-full max-w-3xl p-4">
            {messages.length === 0 ? (
              <ConversationEmptyState
                icon={<MessageSquare className="size-8" />}
                title="Ask about your data"
                description="Answers can include live UI — charts, tables, and stats bound to the demo database."
              >
                {picks && <Suggestions items={picks} onPick={handleSubmit} className="max-w-xl justify-center pt-2" />}
              </ConversationEmptyState>
            ) : (
              <>
                {messages
                  .filter((message) => message.role === "user" || hasContent(message))
                  .map((message) => (
                    <Message from={message.role} key={message.id}>
                      <MessageContent>
                        {message.parts.map((part, index) => {
                          if (isToolUIPart(part)) return <ToolCall key={part.toolCallId} part={part} />;
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
                      {message.metadata && <UsageLine className="mt-1 justify-end text-[11px]" {...message.metadata} />}
                    </Message>
                  ))}
                {waiting && (
                  <Message from="assistant">
                    <MessageContent>
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <LoaderCircle className="size-3.5 animate-spin" />
                        Generating…
                      </span>
                    </MessageContent>
                  </Message>
                )}
                {!readonly && status === "ready" && picks && <Suggestions items={picks} onPick={handleSubmit} />}
              </>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className="mx-auto w-full max-w-3xl px-4 pb-4">
          {error && <p className="pb-2 text-xs text-destructive">{errorText(error.message)}</p>}

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
