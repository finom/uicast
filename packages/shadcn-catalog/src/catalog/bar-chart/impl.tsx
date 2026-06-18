import { createComponentImplementation } from "@ui-fired/react";
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
import { BarChartDef } from "./def";

export const BarChartImpl = createComponentImplementation({
  def: BarChartDef,
  render: ({
    data = [],
    xKey,
    yKeys = [],
    colors,
    height = 300,
    stacked = false,
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
    const barColors = colors ?? defaultColors;
    return (
      <ResponsiveContainer width="100%" height={height} data-key={generatedKey}>
        <RechartsBarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} />
          <YAxis />
          <Tooltip />
          <Legend />
          {yKeys.map((key, i) => (
            <Bar
              key={key}
              dataKey={key}
              fill={barColors[i % barColors.length]}
              stackId={stacked ? "stack" : undefined}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    );
  },
});
