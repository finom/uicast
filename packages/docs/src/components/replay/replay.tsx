"use client";
import { RotateCcwIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ComponentEntry } from "@uicast/core";
import { CalendarImpl, LocationMapImpl, PictureImpl, QRCodeImpl } from "@uicast/shadcn-catalog/content/impls";
import { KanbanBoardImpl } from "@uicast/shadcn-catalog/data/impls";
import { impls as essential } from "@uicast/shadcn-catalog/essential/impls";
import { FieldImpl, FieldLabelImpl, SliderImpl, ToggleGroupImpl } from "@uicast/shadcn-catalog/forms/impls";
import { Button } from "@uicast/shadcn-catalog/ui/button";
import delivery from "./delivery.json";
import { functions, resetData } from "./functions";
import kanban from "./kanban.json";
import loan from "./loan.json";
import orders from "./orders.json";
import { RenderCanvas } from "./render-canvas";
import shop from "./shop.json";
import { StreamPanel } from "./stream-panel";
import warehouses from "./warehouses.json";
import wifi from "./wifi.json";

// biome-ignore format: one component group a line
const CATALOG = [
  ...essential,
  CalendarImpl, LocationMapImpl, PictureImpl, QRCodeImpl,
  FieldImpl, FieldLabelImpl, SliderImpl, ToggleGroupImpl,
  KanbanBoardImpl,
];

const EXAMPLES = [
  { label: "Orders", prompt: "Show this week's orders, with refund buttons.", entries: orders },
  { label: "Kanban", prompt: "Orders to ship, as a kanban I can drag.", entries: kanban },
  { label: "Map", prompt: "Map our warehouses. Click one to see its stock.", entries: warehouses },
  { label: "Delivery", prompt: "Let customers book a delivery slot.", entries: delivery },
  { label: "Shop", prompt: "A shop page for our coffee, with a cart.", entries: shop },
  { label: "Loan", prompt: "Loan calculator with a payoff chart.", entries: loan },
  { label: "Wi-Fi QR", prompt: "A QR code our guests scan to join the Wi-Fi.", entries: wifi },
].map(({ entries, ...example }) => ({ ...example, lines: entries as ComponentEntry[] }));

const ENTRY_MS = 400;

type Hover = { key: string; source: "line" | "element" };
type Pane = "app" | "entries";

const PANE_LABEL = "border-b px-4 py-2 text-xs font-medium text-muted-foreground max-lg:hidden";

export function Replay() {
  const rootRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useRef(false);
  const [example, setExample] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [count, setCount] = useState(0);
  // A new run remounts the document, so its state starts over.
  const [run, setRun] = useState(0);
  const [hovered, setHovered] = useState<Hover | null>(null);
  const [pane, setPane] = useState<Pane>("app");
  const { prompt, lines: all } = EXAMPLES[example];
  const lines = useMemo(() => all.slice(0, count), [all, count]);
  const atEnd = count >= all.length;

  // With reduced motion, the finished app shows at once.
  const play = useCallback((index: number) => {
    resetData();
    setExample(index);
    setRun((n) => n + 1);
    setCount(reducedMotion.current ? EXAMPLES[index].lines.length : 0);
    setPlaying(!reducedMotion.current);
  }, []);

  // The first example starts once the demo is in view.
  useEffect(() => {
    reducedMotion.current = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        play(0);
        observer.disconnect();
      },
      { threshold: 0.3 },
    );
    if (rootRef.current) observer.observe(rootRef.current);
    return () => observer.disconnect();
  }, [play]);

  useEffect(() => {
    if (!playing) return;
    if (atEnd) {
      setPlaying(false);
      return;
    }
    const id = setInterval(() => setCount((n) => Math.min(n + 1, all.length)), ENTRY_MS);
    return () => clearInterval(id);
  }, [playing, atEnd, all.length]);

  const onLineHover = useCallback((key: string | null) => setHovered(key ? { key, source: "line" } : null), []);
  const onElementHover = useCallback((key: string | null) => setHovered(key ? { key, source: "element" } : null), []);

  return (
    // Edge to edge on phones, where Bleed reaches the screen edges.
    <div ref={rootRef} className="overflow-hidden border-y bg-background md:rounded-xl md:border-x">
      <div className="flex items-center gap-3 p-3">
        {/* On phones the examples scroll sideways; the fade shows there are more. */}
        <div className="flex min-w-0 flex-1 gap-2 max-sm:overflow-x-auto max-sm:[mask-image:linear-gradient(to_right,black_80%,transparent)] sm:flex-wrap">
          {EXAMPLES.map(({ label }, i) => (
            <button
              key={label}
              type="button"
              aria-pressed={i === example}
              onClick={() => play(i)}
              className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm transition-colors ${
                i === example
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="shrink-0 font-mono text-xs text-muted-foreground max-sm:hidden">
          {count}/{all.length}
        </span>
        <Button variant="outline" size="sm" onClick={() => play(example)}>
          <RotateCcwIcon />
          Replay
        </Button>
      </div>
      <p className="border-b px-4 pb-3 text-sm">
        <span className="me-2 text-muted-foreground">Prompt</span>
        {prompt}
      </p>

      <div className="flex border-b lg:hidden">
        {(["app", "entries"] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPane(p)}
            className={`flex-1 py-2 text-xs font-medium ${pane === p ? "text-foreground shadow-[inset_0_-2px_0_currentColor]" : "text-muted-foreground"}`}
          >
            {p === "app" ? "Rendered app" : "Model output"}
          </button>
        ))}
      </div>

      {/* Below lg one pane shows: the app grows with its content, the entries scroll in a fixed box. */}
      <div className="grid grid-cols-1 lg:h-[480px] lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div
          className={`flex min-h-0 flex-col max-lg:h-[480px] lg:border-e ${pane === "entries" ? "" : "max-lg:hidden"}`}
        >
          <div className={PANE_LABEL}>Model output</div>
          <StreamPanel lines={lines} hoveredKey={hovered?.key ?? null} onHoverKey={onLineHover} />
        </div>
        <div className={`flex min-h-0 flex-col max-lg:min-h-[480px] ${pane === "app" ? "" : "max-lg:hidden"}`}>
          <div className={PANE_LABEL}>Rendered app</div>
          <div className="min-h-0 flex-1 overflow-auto p-4">
            <RenderCanvas
              key={run}
              lines={lines}
              catalog={CATALOG}
              functions={functions}
              outlineKey={hovered?.source === "line" ? hovered.key : null}
              onHoverKey={onElementHover}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
