import { createComponentImplementation } from "@uicast/react";
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
import { defaultChartColors } from "../../lib/chart-colors";
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
    generatedKey,
  }) => {
    const areaColors = colors ?? defaultChartColors;
    return (
      <div className="w-full min-w-0" data-key={generatedKey}>
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
