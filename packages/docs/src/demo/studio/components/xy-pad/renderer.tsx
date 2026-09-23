import { createComponentImplementation } from "@uicast/react";
import { type PointerEvent, useRef } from "react";
import { XYPadDef } from "./def";

export const XYPadRenderer = createComponentImplementation({
  def: XYPadDef,
  render: ({
    x,
    y,
    xLabel,
    yLabel,
    onMove,
  }, { entry }) => {
    const dragging = useRef(false);

    const emit = (e: PointerEvent<HTMLDivElement>) => {
      const r = e.currentTarget.getBoundingClientRect();
      const nx = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      const ny = Math.min(1, Math.max(0, 1 - (e.clientY - r.top) / r.height));
      onMove({ x: Math.round(nx * 100) / 100, y: Math.round(ny * 100) / 100 });
    };

    return (
      <div data-key={entry.key} className="flex select-none flex-col gap-2">
        <div
          className="relative aspect-square w-full cursor-crosshair overflow-hidden rounded-lg border border-border bg-linear-to-br from-muted/30 to-muted"
          style={{ touchAction: "none" }}
          onPointerDown={(e) => {
            dragging.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            emit(e);
          }}
          onPointerMove={(e) => {
            if (dragging.current) emit(e);
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
