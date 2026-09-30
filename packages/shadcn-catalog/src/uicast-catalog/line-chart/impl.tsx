import { createComponentImplementation } from "@uicast/react";
import {
  Area,
  CartesianGrid,
  Legend,
  Line,
  AreaChart as RechartsAreaChart,
  LineChart as RechartsLineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartFrame } from "../../lib/chart-frame";
import { chartColors } from "../../lib/chart-colors";
import { blockSkeleton } from "../../lib/skeletons";
import { LineChartDef } from "./def";

export const LineChartImpl = createComponentImplementation({
  def: LineChartDef,
  render: ({ data, xKey, yKeys, colors, height, curved, filled, stacked }, { entry, loading }) => {
    const palette = chartColors(colors);
    const type = curved ? "monotone" : "linear";
    // Stacking needs areas: lines do not stack.
    const areas = filled || stacked;
    const Chart = areas ? RechartsAreaChart : RechartsLineChart;
    return (
      <ChartFrame entry={entry} loading={loading} height={height}>
        <Chart data={data} aria-label={areas ? "Area chart" : "Line chart"}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} />
          <YAxis />
          <Tooltip />
          <Legend />
          {yKeys.map((key, i) => {
            const color = palette[i % palette.length];
            return areas ? (
              <Area
                isAnimationActive={false}
                key={key}
                type={type}
                dataKey={key}
                stroke={color}
                fill={color}
                fillOpacity={0.3}
                stackId={stacked ? "stack" : undefined}
              />
            ) : (
              <Line
                isAnimationActive={false}
                key={key}
                type={type}
                dataKey={key}
                stroke={color}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            );
          })}
        </Chart>
      </ChartFrame>
    );
  },
  skeleton: blockSkeleton(300),
});
