"use client";

import {
  experimental_streamedQuery as streamedQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { type ComponentEntry, streamJsonLines } from "@uicast/core";
import { getErrorRecoveryPrompt, type RenderFailure } from "@uicast/core/prompt";
import {
  type ErrorComponentProps,
  EntriesRenderer,
  RendererProvider,
} from "@uicast/react";
import { ConfirmModal } from "@uicast/shadcn-catalog/fallback-components";
import { RecoverableRenderError } from "@/components/recoverable-render-error";
import { allImplementations } from "@uicast/shadcn-catalog/impls";
import { buildPageSystemPrompt } from "@/lib/page-system-prompt";
import { FileText, LoaderCircle, Pencil, ScrollText, Sparkles } from "lucide-react";
import { useMemo, useRef, useState } from "react";
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
import { domainTools } from "@/tools";

type PageMeta = { id: number; title: string; prompt: string | null };
type ControlLine =
  | { type: "error"; error: string }
  | { type: "done"; pageId: number; finishReason?: string };
type GenerateLine = ComponentEntry | ControlLine;

function isEntry(line: GenerateLine): line is ComponentEntry {
  return "component" in line;
}

export function PageView({
  page: initialPage,
  initialEntries,
}: {
  page: PageMeta;
  initialEntries: ComponentEntry[];
}) {
  const [page, setPage] = useState(initialPage);
  const [name, setName] = useState(initialPage.title);
  const [editOpen, setEditOpen] = useState(false);
  const [editPrompt, setEditPrompt] = useState("");
  // Entries from completed runs; the current run's stream appends after these.
  const [history, setHistory] = useState(initialEntries);
  // seq 0 is the auto-started initial run on a freshly created page; edit runs
  // increment it. The server picks initial vs edit mode by the stored entries.
  const [submission, setSubmission] = useState<{ prompt: string; seq: number } | null>(() =>
    initialEntries.length === 0 && initialPage.prompt
      ? { prompt: initialPage.prompt, seq: 0 }
      : null,
  );
  const [promptOpen, setPromptOpen] = useState(false);
  const queryClient = useQueryClient();

  // The generate endpoint's own assembly, so the viewer shows exactly what
  // the endpoint sends.
  const systemPrompt = useMemo(() => (promptOpen ? buildPageSystemPrompt() : null), [promptOpen]);

  const {
    data: lines,
    error: queryError,
    isFetching,
  } = useQuery({
    queryKey: ["generate", page.id, submission?.seq],
    enabled: submission !== null,
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
    queryFn: streamedQuery({
      // Deliberately not consuming the abort signal: a signal-aware queryFn is
      // auto-cancelled when its last observer unmounts, which double-fires the
      // generation under StrictMode and kills it on navigation. Without it the
      // run continues into the cache (and the DB) regardless.
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

  const runEntries = (lines ?? []).filter(isEntry);
  // Raw concatenation across runs — re-emitted keys are resolved by the
  // renderer (replacement semantics); the Entries tab shows the raw lines.
  const entries = [...history, ...runEntries];
  const controls = (lines ?? []).filter((line): line is ControlLine => !isEntry(line));
  const finishReason = controls.find(
    (line): line is Extract<ControlLine, { type: "done" }> => line.type === "done",
  )?.finishReason;
  const errorLine = controls.find((line) => line.type === "error");
  const streamError =
    (errorLine?.type === "error" ? errorLine.error : undefined) ??
    (queryError ? (queryError instanceof Error ? queryError.message : String(queryError)) : null);

  // Rename is metadata-only: PATCH the page row, never touch the generator.
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

  const startEditRun = () => {
    // Fold the finished run into history before the query key changes.
    setHistory((prev) => [...prev, ...runEntries]);
    setSubmission((prev) => ({ prompt: editPrompt.trim(), seq: (prev?.seq ?? 0) + 1 }));
    setEditPrompt("");
  };

  // User-triggered error recovery: the error slot's Recover button reports the
  // failed element back through the edit pipeline, and the model re-emits it
  // corrected (partial replacement clears the error slot). Routed through a
  // ref so `rendererDefaults` below stays referentially stable while the
  // closure still sees the live run state.
  const recoverRef = useRef<(failure: RenderFailure) => void>(() => {});
  recoverRef.current = (failure) => {
    if (isFetching) return;
    setHistory((prev) => [...prev, ...runEntries]);
    setSubmission((prev) => ({
      prompt: getErrorRecoveryPrompt({ failures: [failure] }),
      seq: (prev?.seq ?? 0) + 1,
    }));
  };

  const rendererDefaults = useMemo(
    () => ({
      confirm: ConfirmModal,
      error: ({ error, elementKey }: ErrorComponentProps) => (
        <RecoverableRenderError
          error={error}
          elementKey={elementKey}
          onRecover={
            elementKey
              ? () => recoverRef.current({ key: elementKey, message: error.message })
              : undefined
          }
        />
      ),
    }),
    [],
  );

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4 p-6">
      <header className="flex items-center gap-2">
        <FileText className="size-5 shrink-0 text-muted-foreground" />
        <h1 className="truncate text-lg font-semibold">{page.title}</h1>
        {isFetching && (
          <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
            <LoaderCircle className="size-3.5 animate-spin" />
            Generating…
          </span>
        )}
        <Button
          variant="outline"
          size="sm"
          className="ml-auto"
          onClick={() => setEditOpen((open) => !open)}
        >
          <Pencil data-icon="inline-start" />
          Edit
        </Button>
      </header>

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
            <Dialog open={promptOpen} onOpenChange={setPromptOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" className="mr-auto">
                  <ScrollText data-icon="inline-start" />
                  View system prompt
                </Button>
              </DialogTrigger>
              <DialogContent className="overflow-hidden sm:max-w-3xl">
                <DialogHeader>
                  <DialogTitle>System prompt</DialogTitle>
                  <DialogDescription>
                    What the generate endpoint sends to the model.
                  </DialogDescription>
                </DialogHeader>
                {/* min-w-0: a grid item's min-content width would otherwise let long
                    code lines stretch the dialog past its max-width. */}
                <Tabs defaultValue="markdown" className="min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <TabsList>
                      <TabsTrigger value="markdown">Markdown</TabsTrigger>
                      <TabsTrigger value="raw">Raw</TabsTrigger>
                    </TabsList>
                    {promptTokens !== null && (
                      <p className="text-xs text-muted-foreground">
                        ≈{promptTokens.toLocaleString("en-US")} tokens
                      </p>
                    )}
                  </div>
                  <TabsContent value="markdown">
                    <ScrollArea className="h-[60svh] rounded-md border bg-muted/30 [&_[data-slot=scroll-area-viewport]>div]:block!">
                      <div className="wrap-break-word p-3 text-[13px] leading-relaxed [&_:not(pre)>code]:break-all [&_:not(pre)>code]:whitespace-pre-wrap [&_code]:text-xs [&_h1]:mt-4 [&_h1]:mb-2 [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:mt-3 [&_h2]:mb-1 [&_h2]:text-base [&_h2]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1 [&_h3]:text-sm [&_h3]:font-semibold [&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5 [&_pre]:overflow-x-auto [&_pre]:text-xs">
                        <Streamdown>{systemPrompt ?? ""}</Streamdown>
                      </div>
                    </ScrollArea>
                  </TabsContent>
                  <TabsContent value="raw">
                    <ScrollArea className="h-[60svh] rounded-md border bg-muted/30 [&_[data-slot=scroll-area-viewport]>div]:block!">
                      <div className="whitespace-pre-wrap wrap-break-word p-3 font-mono text-xs">
                        {systemPrompt}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
            <Button disabled={!editPrompt.trim() || isFetching} onClick={startEditRun}>
              {isFetching ? (
                <LoaderCircle data-icon="inline-start" className="animate-spin" />
              ) : (
                <Sparkles data-icon="inline-start" />
              )}
              {isFetching ? "Generating…" : entries.length > 0 ? "Iterate" : "Generate"}
            </Button>
          </CardFooter>
        </Card>
      )}

      {entries.length > 0 ? (
        <Tabs defaultValue="preview">
          <TabsList>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="entries">Entries ({entries.length})</TabsTrigger>
          </TabsList>
          {/* forceMount: unmounting the renderer on tab switch would re-run
              seeds and wipe the generated page's state */}
          <TabsContent value="preview" forceMount className="data-[state=inactive]:hidden">
            <div className="rounded-md border p-4">
              {/* key: stable per page, so iterations stream into the mounted
                  renderer (seeds and state preserved) instead of remounting —
                  and the provider's shared root scope resets per page */}
              <RendererProvider
                key={page.id}
                implementations={allImplementations}
                functions={domainTools}
                fallbackComponents={rendererDefaults}
              >
                <EntriesRenderer entries={entries} />
              </RendererProvider>
            </div>
          </TabsContent>
          <TabsContent value="entries">
            <ScrollArea className="max-h-[70svh] rounded-md border bg-muted/30 [&_[data-slot=scroll-area-viewport]>div]:block!">
              <div className="whitespace-pre-wrap wrap-break-word p-3 font-mono text-xs">
                {entries.map((entry) => JSON.stringify(entry)).join("\n")}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      ) : (
        !isFetching && (
          <p className="text-sm text-muted-foreground">
            This page has no generated content yet.
            {!page.prompt && " Use Edit to describe what to generate."}
          </p>
        )
      )}
    </div>
  );
}
