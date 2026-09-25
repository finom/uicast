"use client";
import { useEffect, useRef, useState } from "react";
import type { ComponentEntry } from "@uicast/core";
import { Button } from "@uicast/shadcn-catalog/ui/button";
import { EntryModal, type SelectedEntry } from "./entry-modal";

type StreamPanelProps = {
  lines: ComponentEntry[];
  hoveredKey: string | null;
  onHoverKey: (key: string | null) => void;
};

export function StreamPanel({ lines, hoveredKey, onHoverKey }: StreamPanelProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<SelectedEntry | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: lines.length is the append signal
  useEffect(() => {
    const el = boxRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines.length]);

  return (
    <div ref={boxRef} className="min-h-0 flex-1 overflow-auto bg-muted/30 p-4 font-mono text-xs/relaxed">
      {lines.length === 0 ? (
        <p className="text-muted-foreground">Waiting for the first entry…</p>
      ) : (
        lines.map((line, i) => (
          <Button
            variant="ghost"
            key={`${line.key}-${i}`}
            onClick={() => setSelected({ entry: line, index: i })}
            onMouseEnter={() => onHoverKey(line.key)}
            onMouseLeave={() => onHoverKey(null)}
            title={`Inspect entry ${i + 1}`}
            className={`h-auto w-full cursor-pointer items-start justify-start gap-0 whitespace-normal break-all rounded-sm px-1 py-0.5 text-left font-mono text-xs font-normal ${
              hoveredKey === line.key ? "bg-primary/10 ring-1 ring-primary/50" : ""
            } ${i === lines.length - 1 ? "text-primary" : "text-foreground/70"}`}
          >
            <span className="mr-2 select-none text-muted-foreground/50">{String(i + 1).padStart(2, "0")}</span>
            {JSON.stringify(line)}
          </Button>
        ))
      )}

      <EntryModal selected={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
