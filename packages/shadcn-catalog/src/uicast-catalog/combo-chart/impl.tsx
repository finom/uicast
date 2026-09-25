import { createComponentImplementation } from "@uicast/react";
import { Bar, CartesianGrid, ComposedChart, Legend, Line, Tooltip, XAxis, YAxis } from "recharts";
import { ChartFrame } from "../../lib/chart-frame";
import { chartColors, defaultChartColors } from "../../lib/chart-colors";
import { blockSkeleton } from "../../lib/skeletons";
import { ComboChartDef } from "./def";

export const ComboChartImpl = createComponentImplementation({
  def: ComboChartDef,
  render: ({ data, xKey, barKeys, lineKeys, barColors, lineColors, height }, { entry, loading }) => {
    const barPalette = chartColors(barColors, defaultChartColors.slice(0, 3));
    const linePalette = chartColors(lineColors, defaultChartColors.slice(3));
    return (
      <ChartFrame entry={entry} loading={loading} height={height}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} />
          <YAxis />
          <Tooltip />
          <Legend />
          {barKeys.map((key, i) => (
            <Bar isAnimationActive={false} key={key} dataKey={key} fill={barPalette[i % barPalette.length]} />
          ))}
          {lineKeys.map((key, i) => (
            <Line
              isAnimationActive={false}
              key={key}
              type="monotone"
              dataKey={key}
              stroke={linePalette[i % linePalette.length]}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </ComposedChart>
      </ChartFrame>
    );
  },
  skeleton: blockSkeleton(300),
});
