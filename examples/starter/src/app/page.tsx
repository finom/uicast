"use client";
import {
  QueryClient,
  QueryClientProvider,
  experimental_streamedQuery as streamedQuery,
  useQuery,
} from "@tanstack/react-query";
import { type ComponentEntry, streamJsonLines } from "@uicast/core";
import { Evaluator } from "@uicast/expr";
import { EntriesRenderer, RendererProvider } from "@uicast/react";
import { ConfirmModal } from "@uicast/shadcn-catalog";
import { impls } from "@uicast/shadcn-catalog/all/impls";
import { Button } from "@uicast/shadcn-catalog/ui/button";
import { Input } from "@uicast/shadcn-catalog/ui/input";
import { Skeleton } from "@uicast/shadcn-catalog/ui/skeleton";
import { useState } from "react";
import { tools } from "@/tools";

// Once, at module scope: the host functions bind on it, and it holds the parse cache.
const evaluator = new Evaluator({ functions: tools });

const fallbackComponents = {
  confirm: ConfirmModal,
  defaultSkeleton: () => <Skeleton className="h-4 w-20" />,
};

function Generated({ prompt }: { prompt: string }) {
  const { data: entries = [] } = useQuery({
    queryKey: ["generate", prompt],
    enabled: prompt !== "",
    // One model call per prompt: no refetch on window focus, no retry.
    staleTime: Infinity,
    retry: false,
    queryFn: streamedQuery({
      streamFn: async () => {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ prompt }),
        });
        if (!res.ok || !res.body) throw new Error(`Generation failed (${res.status})`);
        return streamJsonLines<ComponentEntry>(res.body);
      },
    }),
  });

  return (
    <RendererProvider
      implementations={impls}
      evaluator={evaluator}
      fallbackComponents={fallbackComponents}
    >
      <EntriesRenderer entries={entries} />
    </RendererProvider>
  );
}

export default function Home() {
  const [client] = useState(() => new QueryClient());
  const [draft, setDraft] = useState("");
  const [prompt, setPrompt] = useState("");

  return (
    <QueryClientProvider client={client}>
      <form onSubmit={(e) => { e.preventDefault(); setPrompt(draft); }}>
        <Input value={draft} onChange={(e) => setDraft(e.target.value)} />
        <Button type="submit">Generate</Button>
      </form>
      <Generated prompt={prompt} />
    </QueryClientProvider>
  );
}
