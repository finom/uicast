import { createComponentImplementation } from "@uicast/react";
import { Skeleton } from "../../components/ui/skeleton";
import { busy, cn } from "../../lib/utils";
import {
  LineChart,
  Line,
  Area,
  AreaChart,
  ResponsiveContainer,
} from "recharts";
import { SparklineDef } from "./def";
import { CHART_COLORS } from "../../lib/chart-colors";

export const SparklineImpl = createComponentImplementation({
  def: SparklineDef,
  render: ({
    data = [],
    width,
    height,
    color,
    filled,
  }, { entry, loading }) => {
    const chartData = data.map((value, i) => ({ i, value }));

    return (
      <div
        className={cn("inline-flex items-center", busy(loading))}
        style={{ width, height }}
        aria-busy={loading || undefined} data-key={entry.key}
      >
        <ResponsiveContainer width="100%" height="100%">
          {filled ? (
            <AreaChart data={chartData}>
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
            <LineChart data={chartData}>
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
  placeholder: () => <Skeleton className="w-full" style={{ height: 40 }} />,
});
