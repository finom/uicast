import { createComponentImplementation } from "@uicast/react";
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

export const ScatterChartImpl = createComponentImplementation({
  def: ScatterChartDef,
  render: ({
    data = [],
    xKey,
    yKey,
    nameKey,
    color,
    height,
    generatedKey,
  }) => {
    return (
      <ResponsiveContainer width="100%" height={height} data-key={generatedKey}>
        <RechartsScatterChart>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} type="number" name={xKey} />
          <YAxis dataKey={yKey} type="number" name={yKey} />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} />
          <Scatter isAnimationActive={false} name={nameKey ?? "Data"} data={data} fill={color} />
        </RechartsScatterChart>
      </ResponsiveContainer>
    );
  },
});
