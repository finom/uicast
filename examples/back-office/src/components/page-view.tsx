"use client";

import { experimental_streamedQuery as streamedQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ComponentEntry, isComponentEntry, streamJsonLines } from "@uicast/core";
import { getErrorRecoveryPrompt } from "@uicast/core/prompt";
import { DocumentSkeleton, EntriesRenderer, RendererProvider } from "@uicast/react";
import { impls } from "@uicast/shadcn-catalog/all/impls";
import { evaluator } from "@/lib/evaluator";
import { buildSystemPrompt } from "@/lib/system-prompt";
import { FileText, LoaderCircle, MessageSquareText, Pencil, ScrollText, Sparkles } from "lucide-react";
import { Profiler, type ProfilerOnRenderCallback, useEffect, useMemo, useState } from "react";
import { Streamdown } from "streamdown";
import { Button } from "@uicast/shadcn-catalog/ui/button";
import { Card, CardContent, CardFooter } from "@uicast/shadcn-catalog/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@uicast/shadcn-catalog/ui/dialog";
import { Input } from "@uicast/shadcn-catalog/ui/input";
import { Label } from "@uicast/shadcn-catalog/ui/label";
import { ScrollArea } from "@uicast/shadcn-catalog/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@uicast/shadcn-catalog/ui/tabs";
import { Textarea } from "@uicast/shadcn-catalog/ui/textarea";
import { UsageLine } from "@/components/cost-info";
import { useRendererDefaults } from "@/components/renderer-defaults";
import { showToast, toastCallbackFailure } from "@/components/toaster";
import { setApiOwner } from "@/tools/http";

// `?perf` logs every React commit of the generated tree to `window.__uicastPerf`, for measuring from the console.
type PerfCommit = { at: number; phase: string; actual: number; base: number };
const logCommit: ProfilerOnRenderCallback = (_id, phase, actual, base, _start, commitTime) => {
  const w = window as unknown as { __uicastPerf?: { commits: PerfCommit[] } };
  w.__uicastPerf ??= { commits: [] };
  w.__uicastPerf.commits.push({ at: commitTime, phase, actual, base });
};

type PageMeta = {
  id: number;
  title: string;
  prompt: string | null;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  model: string | null;
};
type ControlLine =
  | { type: "error"; error: string }
  | { type: "usage"; inputTokens: number; outputTokens: number; costUsd: number | null; model: string }
  | { type: "done"; finishReason: string };
type GenerateLine = ComponentEntry | ControlLine;

// `block!`: Radix lays the viewport's content out as a table, which stops long lines from wrapping.
const SCROLL_BOX = "rounded-md border bg-muted/30 [&_[data-slot=scroll-area-viewport]>div]:block!";
const RAW_TEXT = "whitespace-pre-wrap wrap-break-word p-3 font-mono text-xs";

type PageViewProps = { page: PageMeta; initialEntries: ComponentEntry[]; ownerSlug: string; readonly: boolean };

export function PageView({ page: initialPage, initialEntries, ownerSlug, readonly }: PageViewProps) {
  // Reads inside the generated UI serve the page owner's data.
  setApiOwner(ownerSlug);
  const [page, setPage] = useState(initialPage);
  const [name, setName] = useState(initialPage.title);
  const [editOpen, setEditOpen] = useState(false);
  const [editPrompt, setEditPrompt] = useState("");
  const [history, setHistory] = useState(initialEntries);
  // The server picks initial vs edit mode by the stored entries.
  const [submission, setSubmission] = useState<{ prompt: string; seq: number } | null>(() =>
    !readonly && initialEntries.length === 0 && initialPage.prompt ? { prompt: initialPage.prompt, seq: 0 } : null,
  );
  const [promptOpen, setPromptOpen] = useState(false);
  // Seeds fetch through the browser, so the server pass draws only the skeleton.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const perf = mounted && new URLSearchParams(window.location.search).has("perf");
  const queryClient = useQueryClient();

  const systemPrompt = useMemo(() => (promptOpen ? buildSystemPrompt("page") : null), [promptOpen]);

  const {
    data: lines = [],
    error: queryError,
    isFetching,
  } = useQuery({
    queryKey: ["generate", page.id, submission?.seq],
    enabled: submission !== null,
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
    queryFn: streamedQuery({
      // Not consuming the abort signal: a signal-aware queryFn is cancelled when its last observer unmounts, which
      // double-fires the generation under StrictMode and kills it on navigation.
      streamFn: async () => {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ pageId: page.id, prompt: submission?.prompt }),
        });
        if (!res.ok || !res.body) throw new Error(`Generation request failed (${res.status})`);
        return streamJsonLines<GenerateLine>(res.body);
      },
    }),
  });

  // ~4 chars per token — a rough gauge, labeled as such in the UI.
  const promptTokens = systemPrompt ? Math.round(systemPrompt.length / 4) : null;

  const runEntries = lines.filter(isComponentEntry);
  // Re-emitted keys are resolved by the renderer; the Entries tab shows the raw lines.
  const entries = [...history, ...runEntries];
  const control = <T extends ControlLine["type"]>(type: T) =>
    lines.find((line): line is Extract<ControlLine, { type: T }> => !isComponentEntry(line) && line.type === type);
  const finishReason = control("done")?.finishReason;
  const usageLine = control("usage");
  const totalIn = page.inputTokens + (usageLine?.inputTokens ?? 0);
  const totalOut = page.outputTokens + (usageLine?.outputTokens ?? 0);
  const totalCost = page.costUsd + (usageLine?.costUsd ?? 0);
  const model = usageLine?.model ?? page.model;
  const streamError = control("error")?.error ?? queryError?.message;
  const runLabel = entries.length > 0 ? "Iterate" : "Generate";
  // The entry the model is writing: a new page starts at its root, then entries count up from there.
  const progress =
    usageLine || finishReason
      ? "Finishing…"
      : history.length === 0 && runEntries.length === 0
        ? "Generating the root…"
        : `Generating entry ${runEntries.length + 1}…`;

  const renameIfChanged = async () => {
    const title = name.trim();
    if (!title || title === page.title) return;
    const res = await fetch(`/api/pages/${page.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (res.ok) {
      setPage(await res.json());
      queryClient.invalidateQueries({ queryKey: ["pages"] });
    }
  };

  const submit = (prompt: string) => {
    // Fold the finished run into history before the query key changes.
    setHistory((prev) => [...prev, ...runEntries]);
    setSubmission((prev) => ({ prompt, seq: (prev?.seq ?? 0) + 1 }));
  };

  const startEditRun = () => {
    submit(editPrompt.trim());
    setEditPrompt("");
  };

  const rendererDefaults = useRendererDefaults((failure) => {
    if (readonly) {
      showToast("Read-only copy — log in with OpenRouter to run recovery on your own pages.");
      return;
    }
    if (isFetching) return;
    submit(getErrorRecoveryPrompt({ failures: [failure] }));
  });

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4 p-6">
      <header className="flex items-center gap-2">
        <FileText className="size-5 shrink-0 text-muted-foreground" />
        <h1 className="truncate text-lg font-semibold">{page.title}</h1>
        {isFetching && (
          <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
            <LoaderCircle className="size-3.5 animate-spin" />
            {progress}
          </span>
        )}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {page.prompt && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MessageSquareText data-icon="inline-start" />
                  Prompt
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                  <DialogTitle>Prompt</DialogTitle>
                  <DialogDescription>What this page was asked for.</DialogDescription>
                </DialogHeader>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{page.prompt}</p>
              </DialogContent>
            </Dialog>
          )}
          <Dialog open={promptOpen} onOpenChange={setPromptOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <ScrollText data-icon="inline-start" />
                System prompt
              </Button>
            </DialogTrigger>
            <DialogContent className="overflow-hidden sm:max-w-3xl">
              <DialogHeader>
                <DialogTitle>System prompt</DialogTitle>
                <DialogDescription>What the generate endpoint sends to the model.</DialogDescription>
              </DialogHeader>
              {/* min-w-0: a grid item's min-content width would let long code lines stretch the dialog past its max-width. */}
              <Tabs defaultValue="markdown" className="min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <TabsList>
                    <TabsTrigger value="markdown">Markdown</TabsTrigger>
                    <TabsTrigger value="raw">Raw</TabsTrigger>
                  </TabsList>
                  {promptTokens !== null && (
                    <p className="text-xs text-muted-foreground">≈{promptTokens.toLocaleString("en-US")} tokens</p>
                  )}
                </div>
                <TabsContent value="markdown">
                  <ScrollArea className={`h-[60svh] ${SCROLL_BOX}`}>
                    <div className="wrap-break-word p-3 text-[13px] leading-relaxed [&_:not(pre)>code]:break-all [&_:not(pre)>code]:whitespace-pre-wrap [&_code]:text-xs [&_h1]:mt-4 [&_h1]:mb-2 [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:mt-3 [&_h2]:mb-1 [&_h2]:text-base [&_h2]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1 [&_h3]:text-sm [&_h3]:font-semibold [&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5 [&_pre]:overflow-x-auto [&_pre]:text-xs">
                      <Streamdown>{systemPrompt ?? ""}</Streamdown>
                    </div>
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="raw">
                  <ScrollArea className={`h-[60svh] ${SCROLL_BOX}`}>
                    <div className={RAW_TEXT}>{systemPrompt}</div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
          {readonly ? (
            <span className="rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground">
              @{ownerSlug} · read-only
            </span>
          ) : (
            <Button variant="outline" size="sm" disabled={isFetching} onClick={() => setEditOpen((open) => !open)}>
              <Pencil data-icon="inline-start" />
              Edit
            </Button>
          )}
        </div>
      </header>

      {(totalIn > 0 || totalOut > 0) && (
        <UsageLine inputTokens={totalIn} outputTokens={totalOut} costUsd={totalCost} model={model} />
      )}

      {streamError && <p className="text-xs text-destructive">{streamError}</p>}
      {!streamError && finishReason && finishReason !== "stop" && (
        <p className="text-xs text-amber-600">
          Model stopped early (finish reason: {finishReason}) — the output may be incomplete.
        </p>
      )}

      {editOpen && (
        <Card>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="page-name">Page name</Label>
              <Input
                id="page-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={renameIfChanged}
                onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-prompt">Describe a change</Label>
              <Textarea
                id="edit-prompt"
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                placeholder="e.g. Add pagination to the orders table."
                className="min-h-24"
                disabled={isFetching}
              />
            </div>
          </CardContent>
          <CardFooter className="justify-end gap-2">
            <Button disabled={!editPrompt.trim() || isFetching} onClick={startEditRun}>
              {isFetching ? (
                <LoaderCircle data-icon="inline-start" className="animate-spin" />
              ) : (
                <Sparkles data-icon="inline-start" />
              )}
              {isFetching ? "Generating…" : runLabel}
            </Button>
          </CardFooter>
        </Card>
      )}

      {entries.length > 0 && (
        <Tabs defaultValue="preview">
          <TabsList>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="entries">Entries ({entries.length})</TabsTrigger>
          </TabsList>
          {/* forceMount: unmounting the renderer on tab switch would re-run seeds and wipe the generated page's state. */}
          <TabsContent value="preview" forceMount className="data-[state=inactive]:hidden">
            <div className="overflow-x-auto rounded-md border p-4">
              {/* Stable per page, so iterations stream into the mounted renderer. */}
              <RendererProvider
                onError={toastCallbackFailure}
                key={page.id}
                implementations={impls}
                evaluator={evaluator}
                fallbackComponents={rendererDefaults}
              >
                {!mounted ? (
                  <DocumentSkeleton entries={entries} />
                ) : perf ? (
                  <Profiler id="uicast" onRender={logCommit}>
                    <EntriesRenderer entries={entries} />
                  </Profiler>
                ) : (
                  <EntriesRenderer entries={entries} />
                )}
              </RendererProvider>
            </div>
          </TabsContent>
          <TabsContent value="entries">
            <ScrollArea className={`max-h-[70svh] ${SCROLL_BOX}`}>
              <div className={RAW_TEXT}>{entries.map((entry) => JSON.stringify(entry)).join("\n")}</div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      )}
      {entries.length === 0 && mounted && !isFetching && (
        <p className="text-sm text-muted-foreground">
          This page has no generated content yet.
          {!page.prompt && " Use Edit to describe what to generate."}
        </p>
      )}
    </div>
  );
}
