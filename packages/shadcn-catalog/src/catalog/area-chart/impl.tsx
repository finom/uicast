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
import { AreaChartDef } from "./def";

export const AreaChartImpl = createComponentImplementation({
  def: AreaChartDef,
  render: ({
    data = [],
    xKey,
    yKeys = [],
    colors,
    height = 300,
    stacked = false,
    curved = true,
    generatedKey,
  }) => {
    const defaultColors = [
      "#8884d8",
      "#82ca9d",
      "#ffc658",
      "#ff7300",
      "#0088fe",
      "#00c49f",
    ];
    const areaColors = colors ?? defaultColors;
    return (
      <ResponsiveContainer width="100%" height={height} data-key={generatedKey}>
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
    );
  },
});
