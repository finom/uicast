"use client";
import {
  PauseIcon,
  PlayIcon,
  RotateCcwIcon,
  SkipBackIcon,
  SkipForwardIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@ui-fired/shadcn-catalog/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@ui-fired/shadcn-catalog/ui/resizable";
import type { ComponentEntry } from "@ui-fired/core";
import type { DemoConfig } from "@/demo/types";
import { RenderCanvas } from "./render-canvas";
import { StreamPanel } from "./stream-panel";
import { ThemeToggle } from "./theme-toggle";

// Reveal pacing is proportional to each entry's serialized size: a bigger line
// "takes longer to stream in", mirroring real token-by-token generation. At
// 8ms/char the smallest entries land in ~0.5s and the largest in a few seconds.
// MIN/MAX are guards against pathological lines — for the current artifact
// nothing clamps, so the delay is purely `JSON.stringify(line).length × rate`.
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

// "idle" = before the first Play (shows the landing); "playing" = the timer
// auto-advances; "paused" = the user is stepping manually. End-of-stream is
// derived (`count >= TOTAL`), not a phase.
type Phase = "idle" | "playing" | "paused";

export function DemoPlayer({ demo }: { demo: DemoConfig }) {
  const TOTAL = demo.lines.length;
  // `count` entries are revealed (indices 0..count-1); everything else derives
  // from it, so prev/next/pause are just `count` + `phase` edits.
  const [phase, setPhase] = useState<Phase>("idle");
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

  const play = async () => {
    await demo.onPlay?.();
    setCount(0);
    setPhase("playing");
  };

  const replay = async () => {
    setPhase("paused");
    setCount(0);
    await demo.onReplay?.();
    setPhase("playing");
  };

  const togglePlay = () =>
    setPhase((p) => (p === "playing" ? "paused" : "playing"));
  const prev = () => {
    setPhase("paused");
    setCount((c) => Math.max(0, c - 1));
  };
  const next = () => {
    setPhase("paused");
    setCount((c) => Math.min(TOTAL, c + 1));
  };

  if (phase === "idle") {
    return (
      <main className="relative mx-auto max-w-4xl px-6 py-16">
        <div className="absolute top-6 left-6">
          <Link
            href="/"
            className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            ← All demos
          </Link>
        </div>
        <div className="absolute top-6 right-6">
          <ThemeToggle />
        </div>
        <div className="space-y-3 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            ui-fired · live reference
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">{demo.title}</h1>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            {demo.tagline}
          </p>
        </div>

        <div className="mt-10 rounded-xl border border-border bg-card p-5 text-left shadow-sm">
          <p className="mb-3 text-xs font-medium tracking-wide text-muted-foreground">
            THE PROMPT
          </p>
          <pre className="max-h-72 overflow-auto whitespace-pre-wrap text-sm text-foreground/80">
            {demo.prompt}
          </pre>
        </div>

        <div className="mt-10 flex justify-center">
          <Button
            size="lg"
            onClick={play}
            className="h-auto gap-3 rounded-full px-10 py-5 text-lg font-semibold shadow-lg"
          >
            <PlayIcon className="size-5" />
            Play
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 py-3">
        <div className="flex items-baseline gap-3">
          <Link
            href="/"
            className="text-sm text-muted-foreground transition hover:text-foreground"
            aria-label="All demos"
          >
            ←
          </Link>
          <span className="font-semibold">{demo.title}</span>
          <span className="text-xs text-muted-foreground">
            {count}/{TOTAL} entries
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
            onClick={prev}
            disabled={count <= 0}
            aria-label="Previous entry"
          >
            <SkipBackIcon />
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
            <SkipForwardIcon />
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
          <ThemeToggle />
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
                defaultComponents={demo.defaultComponents}
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
