"use client";
import { createComponentImplementation } from "@ui-fired/react";
import { useRef } from "react";
import { XYPadDef } from "./def";

/** Drag anywhere on the pad; `y` is inverted so "up" = 1. */
export const XYPadRenderer = createComponentImplementation({
  def: XYPadDef,
  render: ({
    x = 0.5,
    y = 0.5,
    xLabel,
    yLabel,
    onMove,
    generatedKey,
  }) => {
    const padRef = useRef<HTMLDivElement>(null);
    const dragging = useRef(false);

    const emit = (clientX: number, clientY: number) => {
      const el = padRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const nx = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
      const ny = Math.min(1, Math.max(0, 1 - (clientY - r.top) / r.height));
      onMove?.({ x: Math.round(nx * 100) / 100, y: Math.round(ny * 100) / 100 });
    };

    return (
      <div data-key={generatedKey} className="flex select-none flex-col gap-2">
        <div
          ref={padRef}
          className="relative aspect-square w-full cursor-crosshair overflow-hidden rounded-lg border border-border bg-linear-to-br from-muted/30 to-muted"
          style={{ touchAction: "none" }}
          onPointerDown={(e) => {
            dragging.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            emit(e.clientX, e.clientY);
          }}
          onPointerMove={(e) => {
            if (dragging.current) emit(e.clientX, e.clientY);
          }}
          onPointerUp={() => {
            dragging.current = false;
          }}
        >
          <div
            className="absolute inset-y-0 w-px bg-border/60"
            style={{ left: `${x * 100}%` }}
          />
          <div
            className="absolute inset-x-0 h-px bg-border/60"
            style={{ top: `${(1 - y) * 100}%` }}
          />
          <div
            className="absolute size-5 -translate-1/2 rounded-full border-2 border-background bg-primary shadow-md"
            style={{ left: `${x * 100}%`, top: `${(1 - y) * 100}%` }}
          />
        </div>
        {(xLabel || yLabel) && (
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{xLabel}</span>
            <span>{yLabel}</span>
          </div>
        )}
      </div>
    );
  },
});
