import { createComponentImplementation } from "@uicast/react";
import { CHART_COLORS } from "../../lib/chart-colors";
import { blockSkeleton } from "../../lib/skeletons";
import { busy, cn } from "../../lib/utils";
import { GaugeChartDef } from "./def";

// A half ring in a 200 × 120 box, drawn from the left end clockwise.
const RADIUS = 80;
const STROKE_WIDTH = 20;
const CX = 100;
const CY = 100;
const START = `M ${CX - RADIUS} ${CY}`;
const TRACK = `${START} A ${RADIUS} ${RADIUS} 0 0 1 ${CX + RADIUS} ${CY}`;

export const GaugeChartImpl = createComponentImplementation({
  def: GaugeChartDef,
  render: ({ value, min, max, label, color, height }, { entry, loading }) => {
    const degrees = Math.min(Math.max((value - min) / (max - min), 0), 1) * 180;
    const end = Math.PI - (degrees * Math.PI) / 180;
    const arc = `${START} A ${RADIUS} ${RADIUS} 0 0 1 ${CX + RADIUS * Math.cos(end)} ${CY - RADIUS * Math.sin(end)}`;
    return (
      <div
        className={cn("flex flex-col items-center", busy(loading))}
        aria-busy={loading || undefined}
        data-key={entry.key}
      >
        <svg width="200" height={height} viewBox="0 0 200 120" aria-hidden="true">
          <path d={TRACK} fill="none" stroke="var(--color-muted)" strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
          <path d={arc} fill="none" stroke={CHART_COLORS[color]} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
          <text x={CX} y={CY - 10} textAnchor="middle" className="text-2xl font-bold" fill="currentColor">
            {value}
          </text>
          {label && (
            <text x={CX} y={CY + 12} textAnchor="middle" fill="currentColor" fontSize="12" opacity={0.6}>
              {label}
            </text>
          )}
        </svg>
      </div>
    );
  },
  skeleton: blockSkeleton(300),
});
