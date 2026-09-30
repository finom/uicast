import { createComponentImplementation } from "@uicast/react";
import { Cell, Label, Legend, Pie, PieChart as RechartsPieChart, Tooltip } from "recharts";
import { ChartFrame } from "../../lib/chart-frame";
import { chartColors, defaultChartColors } from "../../lib/chart-colors";
import { blockSkeleton } from "../../lib/skeletons";
import { PieChartDef } from "./def";

const SLICE_COLORS = [...defaultChartColors, "#ffbb28", "#ff8042", "#a4de6c", "#d0ed57"];

export const PieChartImpl = createComponentImplementation({
  def: PieChartDef,
  render: ({ data, colors, height, donut, showLabels, centerLabel }, { entry, loading }) => {
    const palette = chartColors(colors, SLICE_COLORS);
    return (
      <ChartFrame entry={entry} loading={loading} height={height}>
        <RechartsPieChart>
          <Pie
            isAnimationActive={false}
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={donut ? "40%" : 0}
            outerRadius="80%"
            dataKey="value"
            nameKey="name"
            label={showLabels ? ({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%` : undefined}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={palette[i % palette.length]} />
            ))}
            {donut && centerLabel ? (
              // At the pie's own center: the legend takes height from the frame, so the frame's center sits lower.
              <Label value={centerLabel} position="center" className="fill-foreground text-lg font-semibold" />
            ) : null}
          </Pie>
          <Tooltip />
          <Legend />
        </RechartsPieChart>
      </ChartFrame>
    );
  },
  skeleton: blockSkeleton(300),
});
