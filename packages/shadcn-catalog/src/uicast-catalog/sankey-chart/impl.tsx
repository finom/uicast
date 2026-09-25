import { createComponentImplementation } from "@uicast/react";
import { Sankey, Tooltip } from "recharts";
import { ChartFrame } from "../../lib/chart-frame";
import { blockSkeleton } from "../../lib/skeletons";
import { SankeyChartDef } from "./def";

export const SankeyChartImpl = createComponentImplementation({
  def: SankeyChartDef,
  render: ({ nodes, links, height }, { entry, loading }) => (
    <ChartFrame entry={entry} loading={loading} height={height}>
      <Sankey data={{ nodes, links }} nodePadding={30} nodeWidth={10} linkCurvature={0.5}>
        <Tooltip />
      </Sankey>
    </ChartFrame>
  ),
  skeleton: blockSkeleton(300),
});
