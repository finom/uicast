import { createComponentImplementation } from "@uicast/react";
import { dragHandlers, fraction } from "../../../components/drag";
import { XYPadDef } from "./def";

const round2 = (n: number) => Math.round(n * 100) / 100;

export const XYPadImpl = createComponentImplementation({
  def: XYPadDef,
  render: ({ x, y, xLabel, yLabel, onMove }, { entry }) => (
    <div data-key={entry.key} className="flex select-none flex-col gap-2">
      <div
        className="relative aspect-square w-full cursor-crosshair overflow-hidden rounded-lg border border-border bg-linear-to-br from-muted/30 to-muted"
        style={{ touchAction: "none" }}
        {...dragHandlers((e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const nx = fraction(e.clientX, r.left, r.width);
          const ny = 1 - fraction(e.clientY, r.top, r.height);
          onMove({ x: round2(nx), y: round2(ny) });
        })}
      >
        <div className="absolute inset-y-0 w-px bg-border/60" style={{ left: `${x * 100}%` }} />
        <div className="absolute inset-x-0 h-px bg-border/60" style={{ top: `${(1 - y) * 100}%` }} />
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
  ),
});
