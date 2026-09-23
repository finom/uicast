import { createComponentImplementation } from "@uicast/react";
import { Skeleton } from "../../components/ui/skeleton";
import { busy, cn } from "../../lib/utils";
import { Treemap, ResponsiveContainer, Tooltip, type TreemapNode } from "recharts";
import { defaultChartColors } from "../../lib/chart-colors";
import { TreemapChartDef } from "./def";

const defaultColors = [...defaultChartColors, "#ff6b6b", "#a855f7"];
const LABEL_MIN_WIDTH = 50;
const LABEL_MIN_HEIGHT = 25;

const CustomContent = ({ x, y, width, height, name, index }: TreemapNode) => (
  <g>
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={defaultColors[index % defaultColors.length]}
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
  render: ({ data, height }, { entry, loading }) => {
    return (
      <div className={cn("w-full min-w-0", busy(loading))} aria-busy={loading || undefined} data-key={entry.key}>
        <ResponsiveContainer width="100%" height={height}>
          <Treemap
            isAnimationActive={false}
            data={data}
            dataKey="value"
            nameKey="name"
            content={CustomContent}
          >
            <Tooltip />
          </Treemap>
        </ResponsiveContainer>
      </div>
    );
  },
  placeholder: () => <Skeleton className="w-full" style={{ height: 300 }} />,
});
