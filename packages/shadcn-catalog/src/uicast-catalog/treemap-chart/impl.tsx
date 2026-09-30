import { createComponentImplementation } from "@uicast/react";
import { Tooltip, Treemap, type TreemapNode } from "recharts";
import { ChartFrame } from "../../lib/chart-frame";
import { defaultChartColors } from "../../lib/chart-colors";
import { BlockSkeleton } from "../../lib/skeletons";
import { TreemapChartDef } from "./def";

const TILE_COLORS = [...defaultChartColors, "#ff6b6b", "#a855f7"];
const LABEL_MIN_WIDTH = 50;
const LABEL_MIN_HEIGHT = 25;

const VALUE_MIN_HEIGHT = 44;

// The value shows under the name when the tile has room; otherwise only the tooltip has it.
const Tile = ({ x, y, width, height, name, value, index, depth }: TreemapNode) => {
  // The root tile sits under all the others.
  const label = depth > 0 && width > LABEL_MIN_WIDTH && height > LABEL_MIN_HEIGHT;
  const withValue = label && height > VALUE_MIN_HEIGHT;
  return (
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
      {label && (
        <text
          x={x + width / 2}
          y={y + height / 2 - (withValue ? 8 : 0)}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#fff"
          fontSize={12}
          fontWeight={500}
        >
          {name}
        </text>
      )}
      {withValue && (
        <text
          x={x + width / 2}
          y={y + height / 2 + 9}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#fff"
          fontSize={11}
          opacity={0.85}
        >
          {value.toLocaleString()}
        </text>
      )}
    </g>
  );
};

export const TreemapChartImpl = createComponentImplementation({
  def: TreemapChartDef,
  render: ({ data, height }, { entry, loading }) => (
    <ChartFrame entry={entry} loading={loading} height={height}>
      <Treemap isAnimationActive={false} data={data} dataKey="value" nameKey="name" content={Tile} aria-label="Treemap">
        <Tooltip />
      </Treemap>
    </ChartFrame>
  ),
  skeleton: () => <BlockSkeleton height={300} />,
});
