import { createComponentImplementation } from "@uicast/react";
import { Funnel, LabelList, FunnelChart as RechartsFunnelChart, Tooltip } from "recharts";
import { ChartFrame } from "../../lib/chart-frame";
import { chartColors } from "../../lib/chart-colors";
import { blockSkeleton } from "../../lib/skeletons";
import { FunnelChartDef } from "./def";

const STAGE_COLORS = [
  "#8884d8",
  "#83a6ed",
  "#8dd1e1",
  "#82ca9d",
  "#a4de6c",
  "#d0ed57",
  "#ffc658",
  "#ff8042",
  "#ff7300",
  "#ff0000",
];

export const FunnelChartImpl = createComponentImplementation({
  def: FunnelChartDef,
  render: ({ data, colors, height }, { entry, loading }) => {
    const palette = chartColors(colors, STAGE_COLORS);
    const stages = data.map((d, i) => ({ ...d, fill: palette[i % palette.length] }));
    return (
      <ChartFrame entry={entry} loading={loading} height={height}>
        <RechartsFunnelChart
          aria-label="Funnel chart"
          // The stage names sit right of the funnel, and the widest stage spans the whole chart.
          margin={{ right: 120 }}
        >
          <Tooltip />
          <Funnel dataKey="value" data={stages} isAnimationActive>
            <LabelList position="right" fill="currentColor" stroke="none" dataKey="name" />
          </Funnel>
        </RechartsFunnelChart>
      </ChartFrame>
    );
  },
  skeleton: blockSkeleton(300),
});
