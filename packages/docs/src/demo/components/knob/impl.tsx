import { createComponentImplementation } from "@uicast/react";
import { useRef } from "react";
import { KnobDef } from "./def";

const SWEEP_DEG = 270;
const FULL_RANGE_DRAG_PX = 150;

export const KnobImpl = createComponentImplementation({
  def: KnobDef,
  render: ({ value, min, max, label, onTurn }, { entry }) => {
    const drag = useRef<{ startY: number; startVal: number } | null>(null);
    const range = max - min || 1;
    const angle = -SWEEP_DEG / 2 + ((value - min) / range) * SWEEP_DEG;

    return (
      <div data-key={entry.key} className="flex select-none flex-col items-center gap-1.5">
        <div
          role="slider"
          aria-valuenow={value}
          aria-valuemin={min}
          aria-valuemax={max}
          tabIndex={0}
          className="cursor-ns-resize"
          style={{ touchAction: "none" }}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            drag.current = { startY: e.clientY, startVal: value };
          }}
          onPointerMove={(e) => {
            if (!drag.current) return;
            const dy = drag.current.startY - e.clientY;
            const next = drag.current.startVal + (dy / FULL_RANGE_DRAG_PX) * range;
            onTurn({ value: Math.round(Math.min(max, Math.max(min, next))) });
          }}
          onPointerUp={() => {
            drag.current = null;
          }}
        >
          <svg viewBox="0 0 100 100" className="pointer-events-none size-16" aria-hidden="true">
            <circle cx="50" cy="50" r="46" className="fill-card stroke-border" strokeWidth="4" />
            <line
              x1="50"
              y1="50"
              x2="50"
              y2="14"
              className="stroke-primary"
              strokeWidth="6"
              strokeLinecap="round"
              transform={`rotate(${angle} 50 50)`}
            />
          </svg>
        </div>
        {label && (
          <span className="text-xs font-medium text-muted-foreground">
            {label} · {value}
          </span>
        )}
      </div>
    );
  },
});
