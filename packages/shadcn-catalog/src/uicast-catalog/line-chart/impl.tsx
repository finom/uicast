import { createComponentImplementation } from "@uicast/react";
import { Skeleton } from "../../components/ui/skeleton";
import { busy, cn } from "../../lib/utils";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { CHART_COLORS, defaultChartColors } from "../../lib/chart-colors";
import { LineChartDef } from "./def";

export const LineChartImpl = createComponentImplementation({
  def: LineChartDef,
  render: ({
    data,
    xKey,
    yKeys,
    colors,
    height,
    curved,
  }, { entry, loading }) => {
    const lineColors = colors?.map((c) => CHART_COLORS[c]) ?? defaultChartColors;
    return (
      <div className={cn("w-full min-w-0", busy(loading))} aria-busy={loading || undefined} data-key={entry.key}>
        <ResponsiveContainer width="100%" height={height}>
          <RechartsLineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            {yKeys.map((key, i) => (
              <Line isAnimationActive={false}
                key={key}
                type={curved ? "monotone" : "linear"}
                dataKey={key}
                stroke={lineColors[i % lineColors.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </RechartsLineChart>
        </ResponsiveContainer>
      </div>
    );
  },
  skeleton: () => <Skeleton className="w-full" style={{ height: 300 }} />,
});
