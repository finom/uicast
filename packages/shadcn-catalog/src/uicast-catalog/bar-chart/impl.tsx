import { createComponentImplementation } from "@uicast/react";
import { busy, cn } from "../../lib/utils";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { CHART_COLORS, defaultChartColors } from "../../lib/chart-colors";
import { BarChartDef } from "./def";

export const BarChartImpl = createComponentImplementation({
  def: BarChartDef,
  render: ({
    data = [],
    xKey,
    yKeys = [],
    colors,
    height,
    stacked,
  }, { entry, loading }) => {
    const barColors = colors?.map((c) => CHART_COLORS[c]) ?? defaultChartColors;
    return (
      <div className={cn("w-full min-w-0", busy(loading))} aria-busy={loading || undefined} data-key={entry.key}>
        <ResponsiveContainer width="100%" height={height}>
          <RechartsBarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            {yKeys.map((key, i) => (
              <Bar isAnimationActive={false}
                key={key}
                dataKey={key}
                fill={barColors[i % barColors.length]}
                stackId={stacked ? "stack" : undefined}
              />
            ))}
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    );
  },
});
