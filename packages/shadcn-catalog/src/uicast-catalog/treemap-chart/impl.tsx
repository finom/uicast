import { createComponentImplementation } from "@uicast/react";
import { Tooltip, Treemap, type TreemapNode } from "recharts";
import { ChartFrame } from "../../lib/chart-frame";
import { defaultChartColors } from "../../lib/chart-colors";
import { blockSkeleton } from "../../lib/skeletons";
import { TreemapChartDef } from "./def";

const TILE_COLORS = [...defaultChartColors, "#ff6b6b", "#a855f7"];
const LABEL_MIN_WIDTH = 50;
const LABEL_MIN_HEIGHT = 25;

const Tile = ({ x, y, width, height, name, index }: TreemapNode) => (
  <g>
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={TILE_COLORS[index % TILE_COLORS.length]}
      stroke="#fff"
      strokeWidth={2}
      rx={4}
    />
    {width > LABEL_MIN_WIDTH && height > LABEL_MIN_HEIGHT && (
      <text
        x={x + width / 2}
        y={y + height / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#fff"
        fontSize={12}
        fontWeight={500}
      >
        {name}
      </text>
    )}
  </g>
);

export const TreemapChartImpl = createComponentImplementation({
  def: TreemapChartDef,
  render: ({ data, height }, { entry, loading }) => (
    <ChartFrame entry={entry} loading={loading} height={height}>
      <Treemap isAnimationActive={false} data={data} dataKey="value" nameKey="name" content={Tile} aria-label="Treemap">
        <Tooltip />
      </Treemap>
    </ChartFrame>
  ),
  skeleton: blockSkeleton(300),
});
