import { createComponentImplementation } from "@uicast/react";
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
import { defaultChartColors } from "../../lib/chart-colors";
import { LineChartDef } from "./def";

export const LineChartImpl = createComponentImplementation({
  def: LineChartDef,
  render: ({
    data = [],
    xKey,
    yKeys = [],
    colors,
    height,
    curved,
    generatedKey,
  }) => {
    const lineColors = colors ?? defaultChartColors;
    return (
      <div className="w-full min-w-0" data-key={generatedKey}>
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
});
