import { createComponentImplementation } from "@uicast/react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  BarChart as RechartsBarChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartFrame } from "../../lib/chart-frame";
import { chartColors } from "../../lib/chart-colors";
import { blockSkeleton } from "../../lib/skeletons";
import { BarChartDef } from "./def";

export const BarChartImpl = createComponentImplementation({
  def: BarChartDef,
  render: ({ data, xKey, yKeys, lineKeys = [], colors, height, stacked }, { entry, loading }) => {
    const palette = chartColors(colors);
    const Chart = lineKeys.length ? ComposedChart : RechartsBarChart;
    return (
      <ChartFrame entry={entry} loading={loading} height={height}>
        <Chart data={data} aria-label="Bar chart">
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
          {lineKeys.map((key, i) => (
            <Line
              isAnimationActive={false}
              key={key}
              type="monotone"
              dataKey={key}
              stroke={palette[(yKeys.length + i) % palette.length]}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </Chart>
      </ChartFrame>
    );
  },
  skeleton: blockSkeleton(300),
});
