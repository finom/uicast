"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@ui-fired/catalog/components/ui/button";
import type { Fired } from "@ui-fired/core/types";
import { ChunkModal } from "./ChunkModal";

/**
 * The left-hand pane: the raw JSONLines as they "emit", one chunk per line —
 * exactly what the engine consumes. The newest line is highlighted and the
 * panel auto-scrolls as chunks arrive. Clicking a line opens {@link ChunkModal}
 * with that chunk pretty-printed and syntax-highlighted.
 */
export function StreamPanel({ lines }: { lines: Fired.Element[] }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<{
    chunk: Fired.Element;
    index: number;
  } | null>(null);

  useEffect(() => {
    const el = boxRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines.length]);

  return (
    <div
      ref={boxRef}
      className="min-h-0 flex-1 overflow-auto bg-muted/30 p-4 font-mono text-xs leading-relaxed"
    >
      {lines.length === 0 ? (
        <p className="text-muted-foreground">Waiting for the first chunk…</p>
      ) : (
        lines.map((line, i) => (
          <Button
            type="button"
            variant="ghost"
            key={`${line.key}-${i}`}
            onClick={() => setSelected({ chunk: line, index: i })}
            title={`Inspect chunk ${i + 1}`}
            className={`h-auto w-full cursor-pointer items-start justify-start gap-0 whitespace-normal break-all rounded px-1 py-0.5 text-left font-mono text-xs font-normal ${
              i === lines.length - 1 ? "text-primary" : "text-foreground/70"
            }`}
          >
            <span className="mr-2 select-none text-muted-foreground/50">
              {String(i + 1).padStart(2, "0")}
            </span>
            {JSON.stringify(line)}
          </Button>
        ))
      )}

      <ChunkModal
        chunk={selected?.chunk ?? null}
        index={selected?.index ?? null}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
