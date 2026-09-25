import { createComponentImplementation } from "@uicast/react";
import { Bar, CartesianGrid, Legend, BarChart as RechartsBarChart, Tooltip, XAxis, YAxis } from "recharts";
import { ChartFrame } from "../../lib/chart-frame";
import { chartColors } from "../../lib/chart-colors";
import { blockSkeleton } from "../../lib/skeletons";
import { BarChartDef } from "./def";

export const BarChartImpl = createComponentImplementation({
  def: BarChartDef,
  render: ({ data, xKey, yKeys, colors, height, stacked }, { entry, loading }) => {
    const palette = chartColors(colors);
    return (
      <ChartFrame entry={entry} loading={loading} height={height}>
        <RechartsBarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} />
          <YAxis />
          <Tooltip />
          <Legend />
          {yKeys.map((key, i) => (
            <Bar
              isAnimationActive={false}
              key={key}
              dataKey={key}
              fill={palette[i % palette.length]}
              stackId={stacked ? "stack" : undefined}
            />
          ))}
        </RechartsBarChart>
      </ChartFrame>
    );
  },
  skeleton: blockSkeleton(300),
});
