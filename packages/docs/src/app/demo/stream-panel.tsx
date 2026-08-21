"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@uicast/shadcn-catalog/ui/button";
import type { ComponentEntry } from "uicast";
import { EntryModal } from "./entry-modal";

/**
 * The left-hand pane: the raw JSONLines as they "emit", one entry per line —
 * exactly what the engine consumes. The newest line is highlighted and the
 * panel auto-scrolls as entries arrive. Clicking a line opens {@link EntryModal}
 * with that entry pretty-printed and syntax-highlighted.
 */
export function StreamPanel({
  lines,
  hoveredKey,
  onHoverKey,
}: {
  lines: ComponentEntry[];
  hoveredKey: string | null;
  onHoverKey: (key: string | null) => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<{
    entry: ComponentEntry;
    index: number;
  } | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: lines.length is the append signal; the array identity churns per render
  useEffect(() => {
    const el = boxRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines.length]);

  return (
    <div
      ref={boxRef}
      className="min-h-0 flex-1 overflow-auto bg-muted/30 p-4 font-mono text-xs/relaxed"
    >
      {lines.length === 0 ? (
        <p className="text-muted-foreground">Waiting for the first entry…</p>
      ) : (
        lines.map((line, i) => (
          <Button
            type="button"
            variant="ghost"
            key={`${line.key}-${i}`}
            onClick={() => setSelected({ entry: line, index: i })}
            onMouseEnter={() => onHoverKey(line.key)}
            onMouseLeave={() => onHoverKey(null)}
            title={`Inspect entry ${i + 1}`}
            className={`h-auto w-full cursor-pointer items-start justify-start gap-0 whitespace-normal break-all rounded-sm px-1 py-0.5 text-left font-mono text-xs font-normal ${
              hoveredKey === line.key
                ? "bg-primary/10 ring-1 ring-primary/50"
                : ""
            } ${i === lines.length - 1 ? "text-primary" : "text-foreground/70"}`}
          >
            <span className="mr-2 select-none text-muted-foreground/50">
              {String(i + 1).padStart(2, "0")}
            </span>
            {JSON.stringify(line)}
          </Button>
        ))
      )}

      <EntryModal
        entry={selected?.entry ?? null}
        index={selected?.index ?? null}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
