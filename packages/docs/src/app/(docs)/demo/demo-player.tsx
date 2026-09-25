"use client";
import {
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PauseIcon,
  PlayIcon,
  RotateCcwIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ComponentEntry } from "@uicast/core";
import { Button } from "@uicast/shadcn-catalog/ui/button";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@uicast/shadcn-catalog/ui/resizable";
import type { DemoConfig } from "@/demo/types";
import { RenderCanvas } from "./render-canvas";
import { StreamPanel } from "./stream-panel";
import { SystemPromptDialog } from "./system-prompt-dialog";

// Paced by each entry's serialized size, like token-by-token generation.
const MS_PER_CHAR = 8;
const MIN_REVEAL_MS = 250;
const MAX_REVEAL_MS = 6000;

const revealDelay = (line: ComponentEntry) =>
  Math.min(MAX_REVEAL_MS, Math.max(MIN_REVEAL_MS, JSON.stringify(line).length * MS_PER_CHAR));

// react-resizable-panels takes `orientation` as a prop, so the `md` breakpoint is tracked here.
function useIsWide() {
  const [wide, setWide] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setWide(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return wide;
}

type Hover = { key: string; source: "line" | "element" };

function StatusDot({ playing, atEnd }: { playing: boolean; atEnd: boolean }) {
  const color = atEnd || playing ? "bg-emerald-500" : "bg-amber-500";
  return (
    <span className="relative flex size-2" aria-hidden="true">
      {playing && !atEnd && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
      )}
      <span className={`relative inline-flex size-2 rounded-full ${color}`} />
    </span>
  );
}

export function DemoPlayer({ demo }: { demo: DemoConfig }) {
  const total = demo.lines.length;
  const [playing, setPlaying] = useState(false);
  const [count, setCount] = useState(0);
  const [hovered, setHovered] = useState<Hover | null>(null);
  const outlineKey = hovered?.source === "line" ? hovered.key : null;
  const revealed = useMemo(() => demo.lines.slice(0, count), [demo.lines, count]);
  const atEnd = count >= total;
  const wide = useIsWide();

  // The cleanup cancels the pending tick, which is how Pause, Prev and Next stop the auto-advance.
  useEffect(() => {
    if (!playing) return;
    if (atEnd) {
      setPlaying(false);
      return;
    }
    const id = setTimeout(() => setCount((c) => c + 1), revealDelay(demo.lines[count]));
    return () => clearTimeout(id);
  }, [playing, count, atEnd, demo.lines]);

  // `onPlay` is idempotent, so StrictMode's double invoke is harmless.
  useEffect(() => {
    let mounted = true;
    (async () => {
      await demo.onPlay?.();
      if (mounted) setPlaying(true);
    })();
    return () => {
      mounted = false;
    };
  }, [demo]);

  const replay = async () => {
    setPlaying(false);
    setCount(0);
    await demo.onReplay?.();
    setPlaying(true);
  };

  const seek = (to: number) => {
    setPlaying(false);
    setCount(Math.min(total, Math.max(0, to)));
  };
  const controls = [
    { id: "start", label: "Jump to start", Icon: ChevronFirstIcon, disabled: count <= 0, onClick: () => seek(0) },
    { id: "prev", label: "Previous entry", Icon: ChevronLeftIcon, disabled: count <= 0, onClick: () => seek(count - 1) },
    { id: "play", label: playing ? "Pause" : "Play", Icon: playing ? PauseIcon : PlayIcon, disabled: atEnd, onClick: () => setPlaying(!playing) },
    { id: "next", label: "Next entry", Icon: ChevronRightIcon, disabled: atEnd, onClick: () => seek(count + 1) },
    { id: "end", label: "Jump to end", Icon: ChevronLastIcon, disabled: atEnd, onClick: () => seek(total) },
  ];

  return (
    // data-demo-surface lets globals.css hide the docs footer on this route.
    <main data-demo-surface="" className="flex h-[calc(100dvh-var(--nextra-navbar-height))] flex-col">
      <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-border px-3 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/demo" className="text-sm text-muted-foreground transition hover:text-foreground" aria-label="All demos">
            ←
          </Link>
          <span className="truncate font-semibold">{demo.title}</span>
          <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs text-muted-foreground">
            <StatusDot playing={playing} atEnd={atEnd} />
            {count}/{total} · {atEnd ? "ready" : playing ? "streaming…" : "paused"}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {controls.map(({ id, label, Icon, disabled, onClick }) => (
            <Button key={id} variant="outline" size="icon-sm" onClick={onClick} disabled={disabled} aria-label={label}>
              <Icon />
            </Button>
          ))}
          <Button variant="outline" size="sm" onClick={replay} className="ml-1 gap-1.5">
            <RotateCcwIcon />
            Replay
          </Button>
          <div className="mx-1 hidden h-5 w-px bg-border sm:block" aria-hidden="true" />
          <SystemPromptDialog demo={demo} />
        </div>
      </header>

      <div className="min-h-0 flex-1">
        <ResizablePanelGroup
          // Remount on orientation change so panel sizes reset.
          key={wide ? "h" : "v"}
          orientation={wide ? "horizontal" : "vertical"}
        >
          <ResizablePanel defaultSize="50%" minSize="20%" className="flex h-full min-h-0 flex-col">
            <div className="shrink-0 border-b border-border px-4 py-2 text-xs font-medium tracking-wide text-muted-foreground">
              STREAMED ENTRIES
            </div>
            <StreamPanel
              lines={revealed}
              hoveredKey={hovered?.key ?? null}
              onHoverKey={(key) => setHovered(key ? { key, source: "line" } : null)}
            />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize="50%" minSize="20%" className="flex h-full min-h-0 flex-col">
            <div className="shrink-0 border-b border-border bg-background px-4 py-2 text-xs font-medium tracking-wide text-muted-foreground">
              RENDERED APP
            </div>
            <div className="min-h-0 flex-1 overflow-auto p-6">
              <RenderCanvas
                lines={revealed}
                catalog={demo.catalog}
                functions={demo.functions}
                outlineKey={outlineKey}
                onHoverKey={(key) => setHovered(key ? { key, source: "element" } : null)}
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </main>
  );
}
