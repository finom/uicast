import { createComponentImplementation } from "@uicast/react";
import { busy, cn } from "../../lib/utils";
import { LineChart, Line, Area, AreaChart, ResponsiveContainer } from "recharts";
import { SparklineDef } from "./def";
import { CHART_COLORS } from "../../lib/chart-colors";
import { BlockSkeleton } from "../../lib/skeletons";

export const SparklineImpl = createComponentImplementation({
  def: SparklineDef,
  render: ({ data, width, height, color, filled }, { entry, loading }) => {
    const chartData = data.map((value) => ({ value }));
    // Recharts makes a chart a tab stop for its tooltip; a sparkline has none, so it is a named image instead.
    const image = { role: "img", tabIndex: -1, "aria-label": data.join(", ") };

    return (
      <div
        className={cn("inline-flex items-center", busy(loading))}
        style={{ width, height }}
        aria-busy={loading || undefined}
        data-key={entry.key}
      >
        <ResponsiveContainer width="100%" height="100%">
          {filled ? (
            <AreaChart data={chartData} {...image}>
              <Area
                type="monotone"
                dataKey="value"
                stroke={CHART_COLORS[color]}
                fill={CHART_COLORS[color]}
                fillOpacity={0.2}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          ) : (
            <LineChart data={chartData} {...image}>
              <Line
                type="monotone"
                dataKey="value"
                stroke={CHART_COLORS[color]}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    );
  },
  skeleton: () => <BlockSkeleton height={40} />,
});
