import { createComponentImplementation } from "@uicast/react";
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
import { defaultChartColors } from "../../lib/chart-colors";
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
    generatedKey,
  }) => {
    const barColors = colors ?? defaultChartColors;
    return (
      <ResponsiveContainer width="100%" height={height} data-key={generatedKey}>
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
    );
  },
});
