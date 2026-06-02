import { createAIComponentRenderer } from "ui-fired/core/render/createAIComponentRenderer";
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
import { ComboChartDef } from "./def";

export const ComboChartRenderer = createAIComponentRenderer({
  def: ComboChartDef,
  renderer: ({
    data = [],
    xKey,
    barKeys = [],
    lineKeys = [],
    barColors,
    lineColors,
    height = 300,
    generatedKey,
  }) => {
    const defaultBarColors = ["#8884d8", "#82ca9d", "#ffc658"];
    const defaultLineColors = ["#ff7300", "#0088fe", "#00c49f"];
    const bColors = barColors ?? defaultBarColors;
    const lColors = lineColors ?? defaultLineColors;

    return (
      <ResponsiveContainer width="100%" height={height} data-key={generatedKey}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} />
          <YAxis />
          <Tooltip />
          <Legend />
          {barKeys.map((key, i) => (
            <Bar key={key} dataKey={key} fill={bColors[i % bColors.length]} />
          ))}
          {lineKeys.map((key, i) => (
            <Line
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
