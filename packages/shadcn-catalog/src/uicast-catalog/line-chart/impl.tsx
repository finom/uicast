import { createComponentImplementation } from "@uicast/react";
import { CartesianGrid, Legend, Line, LineChart as RechartsLineChart, Tooltip, XAxis, YAxis } from "recharts";
import { ChartFrame } from "../../lib/chart-frame";
import { chartColors } from "../../lib/chart-colors";
import { blockSkeleton } from "../../lib/skeletons";
import { LineChartDef } from "./def";

export const LineChartImpl = createComponentImplementation({
  def: LineChartDef,
  render: ({ data, xKey, yKeys, colors, height, curved }, { entry, loading }) => {
    const palette = chartColors(colors);
    return (
      <ChartFrame entry={entry} loading={loading} height={height}>
        <RechartsLineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} />
          <YAxis />
          <Tooltip />
          <Legend />
          {yKeys.map((key, i) => (
            <Line
              isAnimationActive={false}
              key={key}
              type={curved ? "monotone" : "linear"}
              dataKey={key}
              stroke={palette[i % palette.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </RechartsLineChart>
      </ChartFrame>
    );
  },
  skeleton: blockSkeleton(300),
});
