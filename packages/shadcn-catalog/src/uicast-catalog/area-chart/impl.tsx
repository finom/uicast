import { createComponentImplementation } from "@uicast/react";
import { Area, CartesianGrid, Legend, AreaChart as RechartsAreaChart, Tooltip, XAxis, YAxis } from "recharts";
import { ChartFrame } from "../../lib/chart-frame";
import { chartColors } from "../../lib/chart-colors";
import { blockSkeleton } from "../../lib/skeletons";
import { AreaChartDef } from "./def";

export const AreaChartImpl = createComponentImplementation({
  def: AreaChartDef,
  render: ({ data, xKey, yKeys, colors, height, stacked, curved }, { entry, loading }) => {
    const palette = chartColors(colors);
    return (
      <ChartFrame entry={entry} loading={loading} height={height}>
        <RechartsAreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} />
          <YAxis />
          <Tooltip />
          <Legend />
          {yKeys.map((key, i) => (
            <Area
              isAnimationActive={false}
              key={key}
              type={curved ? "monotone" : "linear"}
              dataKey={key}
              stroke={palette[i % palette.length]}
              fill={palette[i % palette.length]}
              fillOpacity={0.3}
              stackId={stacked ? "stack" : undefined}
            />
          ))}
        </RechartsAreaChart>
      </ChartFrame>
    );
  },
  skeleton: blockSkeleton(300),
});
