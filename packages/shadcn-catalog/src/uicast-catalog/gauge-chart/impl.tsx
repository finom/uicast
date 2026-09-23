import { createComponentImplementation } from "@uicast/react";
import { Skeleton } from "../../components/ui/skeleton";
import { busy, cn } from "../../lib/utils";
import { GaugeChartDef } from "./def";
import { CHART_COLORS } from "../../lib/chart-colors";

export const GaugeChartImpl = createComponentImplementation({
  def: GaugeChartDef,
  render: ({
    value,
    min,
    max,
    label,
    color,
    height,
  }, { entry, loading }) => {
    const range = max - min;
    const percentage = Math.min(Math.max((value - min) / range, 0), 1);
    const angle = percentage * 180;
    const radius = 80;
    const strokeWidth = 20;
    const cx = 100;
    const cy = 100;

    const bgPath = `M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`;

    const endAngle = Math.PI - (angle * Math.PI) / 180;
    const endX = cx + radius * Math.cos(endAngle);
    const endY = cy - radius * Math.sin(endAngle);
    const valuePath = `M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`;

    return (
      <div className={cn("flex flex-col items-center", busy(loading))} aria-busy={loading || undefined} data-key={entry.key}>
        <svg width="200" height={height} viewBox="0 0 200 120" aria-hidden="true">
          <path
            d={bgPath}
            fill="none"
            stroke="var(--color-muted)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          <path
            d={valuePath}
            fill="none"
            stroke={CHART_COLORS[color]}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          <text
            x={cx}
            y={cy - 10}
            textAnchor="middle"
            className="text-2xl font-bold"
            fill="currentColor"
          >
            {value}
          </text>
          {label && (
            <text
              x={cx}
              y={cy + 12}
              textAnchor="middle"
              fill="currentColor"
              fontSize="12"
              opacity={0.6}
            >
              {label}
            </text>
          )}
        </svg>
      </div>
    );
  },
  placeholder: () => <Skeleton className="w-full" style={{ height: 300 }} />,
});
