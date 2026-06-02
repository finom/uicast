import { createAIComponentRenderer } from "ui-fired/core/render/createAIComponentRenderer";
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
import { LineChartDef } from "./def";

export const LineChartRenderer = createAIComponentRenderer({
  def: LineChartDef,
  renderer: ({
    data = [],
    xKey,
    yKeys = [],
    colors,
    height = 300,
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
    const lineColors = colors ?? defaultColors;
    return (
      <ResponsiveContainer width="100%" height={height} data-key={generatedKey}>
        <RechartsLineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} />
          <YAxis />
          <Tooltip />
          <Legend />
          {yKeys.map((key, i) => (
            <Line
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
    );
  },
});
