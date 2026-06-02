import { createAIComponentRenderer } from "@ui-fired/core/render/createAIComponentRenderer";
import {
  ScatterChart as RechartsScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ScatterChartDef } from "./def";

export const ScatterChartRenderer = createAIComponentRenderer({
  def: ScatterChartDef,
  renderer: ({
    data = [],
    xKey,
    yKey,
    nameKey,
    color = "#8884d8",
    height = 300,
    generatedKey,
  }) => {
    return (
      <ResponsiveContainer width="100%" height={height} data-key={generatedKey}>
        <RechartsScatterChart>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} type="number" name={xKey} />
          <YAxis dataKey={yKey} type="number" name={yKey} />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} />
          <Scatter name={nameKey ?? "Data"} data={data} fill={color} />
        </RechartsScatterChart>
      </ResponsiveContainer>
    );
  },
});
