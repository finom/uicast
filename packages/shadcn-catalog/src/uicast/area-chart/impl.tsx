import { createComponentImplementation } from "@uicast/react";
import { busy, cn } from "../../lib/utils";
import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { CHART_COLORS, defaultChartColors } from "../../lib/chart-colors";
import { AreaChartDef } from "./def";

export const AreaChartImpl = createComponentImplementation({
  def: AreaChartDef,
  render: ({
    data = [],
    xKey,
    yKeys = [],
    colors,
    height,
    stacked,
    curved,
  }, { entry, loading }) => {
    const areaColors = colors?.map((c) => CHART_COLORS[c]) ?? defaultChartColors;
    return (
      <div className={cn("w-full min-w-0", busy(loading))} aria-busy={loading || undefined} data-key={entry.key}>
        <ResponsiveContainer width="100%" height={height}>
          <RechartsAreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            {yKeys.map((key, i) => (
              <Area isAnimationActive={false}
                key={key}
                type={curved ? "monotone" : "linear"}
                dataKey={key}
                stroke={areaColors[i % areaColors.length]}
                fill={areaColors[i % areaColors.length]}
                fillOpacity={0.3}
                stackId={stacked ? "stack" : undefined}
              />
            ))}
          </RechartsAreaChart>
        </ResponsiveContainer>
      </div>
    );
  },
});
