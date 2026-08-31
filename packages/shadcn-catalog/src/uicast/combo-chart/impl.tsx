import { createComponentImplementation } from "@uicast/react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { defaultChartColors } from "../../lib/chart-colors";
import { ComboChartDef } from "./def";

export const ComboChartImpl = createComponentImplementation({
  def: ComboChartDef,
  render: ({
    data = [],
    xKey,
    barKeys = [],
    lineKeys = [],
    barColors,
    lineColors,
    height,
    generatedKey,
  }) => {
    const bColors = barColors ?? defaultChartColors.slice(0, 3);
    const lColors = lineColors ?? defaultChartColors.slice(3);

    return (
      <ResponsiveContainer width="100%" height={height} data-key={generatedKey}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} />
          <YAxis />
          <Tooltip />
          <Legend />
          {barKeys.map((key, i) => (
            <Bar isAnimationActive={false} key={key} dataKey={key} fill={bColors[i % bColors.length]} />
          ))}
          {lineKeys.map((key, i) => (
            <Line isAnimationActive={false}
              key={key}
              type="monotone"
              dataKey={key}
              stroke={lColors[i % lColors.length]}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    );
  },
});
