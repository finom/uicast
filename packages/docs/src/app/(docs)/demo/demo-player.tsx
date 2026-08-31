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
import { Button } from "@uicast/shadcn-catalog/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@uicast/shadcn-catalog/ui/resizable";
import type { ComponentEntry } from "@uicast/core";
import type { DemoConfig } from "@/demo/types";
import { RenderCanvas } from "./render-canvas";
import { StreamPanel } from "./stream-panel";
import { SystemPromptDialog } from "./system-prompt-dialog";

// Reveal pacing is proportional to each entry's serialized size: a bigger line
// "takes longer to stream in", mirroring real token-by-token generation. At
// 8ms/char the smallest entries land in ~0.5s and the largest in a few seconds.
// MIN/MAX are guards against pathological lines.
const MS_PER_CHAR = 8;
const MIN_REVEAL_MS = 250;
const MAX_REVEAL_MS = 6000;

const revealDelay = (line: ComponentEntry) =>
  Math.min(
    MAX_REVEAL_MS,
    Math.max(MIN_REVEAL_MS, JSON.stringify(line).length * MS_PER_CHAR),
  );

// The two panels split horizontally on wide screens (side by side) and
// vertically on narrow ones (stacked). react-resizable-panels takes `direction`
// as a prop (not a CSS media query), so we track the `md` breakpoint here.
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

// "playing" = the timer auto-advances; "paused" = the user is stepping
// manually (also the initial state, while `onPlay` seeds the data layer —
// playback starts as soon as it resolves). End-of-stream is derived
// (`count >= TOTAL`), not a phase.
type Phase = "playing" | "paused";

// Header status: label + colored dot, with a ping halo while streaming.
function StatusDot({ playing, atEnd }: { playing: boolean; atEnd: boolean }) {
  const color = atEnd
    ? "bg-emerald-500"
    : playing
      ? "bg-emerald-500"
      : "bg-amber-500";
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
  const TOTAL = demo.lines.length;
  // `count` entries are revealed (indices 0..count-1); everything else derives
  // from it, so the transport buttons are just `count` + `phase` edits.
  const [phase, setPhase] = useState<Phase>("paused");
  const [count, setCount] = useState(0);
  // Bidirectional hover link between the two panels, tracking *which side* the
  // hover came from. The rendered element is outlined only when the hover
  // originates from a JSON line (`source: "line"`); pointing at the rendered app
  // itself only highlights the matching line, so the live UI keeps looking
  // normal — no outline on the element you're already hovering. `null` = none.
  const [hovered, setHovered] = useState<{
    key: string;
    source: "line" | "element";
  } | null>(null);
  const hoveredKey = hovered?.key ?? null;
  const outlineKey = hovered?.source === "line" ? hovered.key : null;
  const revealed = useMemo(
    () => demo.lines.slice(0, count),
    [demo.lines, count],
  );
  const atEnd = count >= TOTAL;
  const wide = useIsWide();

  // Autoplay: while "playing", schedule the next entry paced by *its* serialized
  // length (see `revealDelay`). Re-runs on every `count` change (chaining the
  // reveal) and on pause/resume — the cleanup cancels any pending tick, which is
  // what makes Pause / Prev / Next stop the auto-advance. Settles at the end.
  // biome-ignore lint/correctness/useExhaustiveDependencies: paced by `count` chaining and phase — see the comment above
  useEffect(() => {
    if (phase !== "playing") return;
    if (atEnd) {
      setPhase("paused");
      return;
    }
    const id = setTimeout(
      () => setCount((c) => c + 1),
      revealDelay(demo.lines[count]),
    );
    return () => clearTimeout(id);
  }, [phase, count, atEnd]);

  // Click a demo card → watch it stream, no landing stop in between: seed the
  // data layer (if any) and start playback as soon as the page mounts.
  // `onPlay` (seedIfEmpty for inventory) is idempotent, so the StrictMode
  // double-invoke in dev is harmless.
  useEffect(() => {
    let mounted = true;
    (async () => {
      await demo.onPlay?.();
      if (mounted) setPhase("playing");
    })();
    return () => {
      mounted = false;
    };
  }, [demo]);

  const replay = async () => {
    setPhase("paused");
    setCount(0);
    await demo.onReplay?.();
    setPhase("playing");
  };

  const togglePlay = () =>
    setPhase((p) => (p === "playing" ? "paused" : "playing"));
  const toStart = () => {
    setPhase("paused");
    setCount(0);
  };
  const prev = () => {
    setPhase("paused");
    setCount((c) => Math.max(0, c - 1));
  };
  const next = () => {
    setPhase("paused");
    setCount((c) => Math.min(TOTAL, c + 1));
  };
  const toEnd = () => {
    setPhase("paused");
    setCount(TOTAL);
  };

  return (
    // Fill the viewport minus the docs navbar the (docs) layout puts above us.
    // data-demo-surface lets globals.css hide the docs footer on this route.
    <main
      data-demo-surface=""
      className="flex h-[calc(100dvh-var(--nextra-navbar-height))] flex-col"
    >
      <header className="flex items-center justify-between gap-3 border-b border-border px-6 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/demo"
            className="text-sm text-muted-foreground transition hover:text-foreground"
            aria-label="All demos"
          >
            ←
          </Link>
          <span className="truncate font-semibold">{demo.title}</span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <StatusDot playing={phase === "playing"} atEnd={atEnd} />
            {count}/{TOTAL}
            {atEnd
              ? " · ready"
              : phase === "playing"
                ? " · streaming…"
                : " · paused"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={toStart}
            disabled={count <= 0}
            aria-label="Jump to start"
          >
            <ChevronFirstIcon />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={prev}
            disabled={count <= 0}
            aria-label="Previous entry"
          >
            <ChevronLeftIcon />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={togglePlay}
            disabled={atEnd}
            aria-label={phase === "playing" ? "Pause" : "Play"}
          >
            {phase === "playing" ? <PauseIcon /> : <PlayIcon />}
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={next}
            disabled={atEnd}
            aria-label="Next entry"
          >
            <ChevronRightIcon />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={toEnd}
            disabled={atEnd}
            aria-label="Jump to end"
          >
            <ChevronLastIcon />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={replay}
            className="ml-1 gap-1.5"
          >
            <RotateCcwIcon />
            Replay
          </Button>
          <div className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
          <SystemPromptDialog demo={demo} />
        </div>
      </header>

      <div className="min-h-0 flex-1">
        <ResizablePanelGroup
          // Remount on orientation change so panel sizes reset cleanly.
          key={wide ? "h" : "v"}
          orientation={wide ? "horizontal" : "vertical"}
        >
          <ResizablePanel
            defaultSize={50}
            minSize={20}
            className="flex h-full min-h-0 flex-col"
          >
            <div className="shrink-0 border-b border-border px-4 py-2 text-xs font-medium tracking-wide text-muted-foreground">
              STREAMED JSONLINES
            </div>
            <StreamPanel
              lines={revealed}
              hoveredKey={hoveredKey}
              onHoverKey={(key) =>
                setHovered(key ? { key, source: "line" } : null)
              }
            />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel
            defaultSize={50}
            minSize={20}
            className="flex h-full min-h-0 flex-col"
          >
            <div className="shrink-0 border-b border-border bg-background px-4 py-2 text-xs font-medium tracking-wide text-muted-foreground">
              RENDERED APP
            </div>
            <div className="min-h-0 flex-1 overflow-auto p-6">
              <RenderCanvas
                lines={revealed}
                catalog={demo.catalog}
                functions={demo.functions}
                fallbackComponents={demo.fallbackComponents}
                outlineKey={outlineKey}
                onHoverKey={(key) =>
                  setHovered(key ? { key, source: "element" } : null)
                }
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </main>
  );
}
