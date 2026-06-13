"use client";
import { createComponentImplementation } from "@ui-fired/react";
import { useRef } from "react";
import { KnobDef } from "./def";

/**
 * Drag vertically to turn. The indicator line sweeps -135°..+135° across the
 * value range. `data-key={generatedKey}` on the root keeps the demo's
 * hover-highlight working (line ⇄ element) — the universal catalog convention.
 */
export const KnobRenderer = createComponentImplementation({
  def: KnobDef,
  render: ({ value = 50, min = 0, max = 100, label, onTurn, generatedKey }) => {
    const drag = useRef<{ startY: number; startVal: number } | null>(null);
    const range = max - min || 1;
    const angle = -135 + ((value - min) / range) * 270;

    return (
      <div
        data-key={generatedKey}
        className="flex select-none flex-col items-center gap-1.5"
      >
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
            const next = Math.min(
              max,
              Math.max(min, drag.current.startVal + (dy / 150) * range),
            );
            onTurn?.({ value: Math.round(next) });
          }}
          onPointerUp={() => {
            drag.current = null;
          }}
        >
          <svg
            viewBox="0 0 100 100"
            className="pointer-events-none size-16"
            aria-hidden="true"
          >
            <circle
              cx="50"
              cy="50"
              r="46"
              className="fill-card stroke-border"
              strokeWidth="4"
            />
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
