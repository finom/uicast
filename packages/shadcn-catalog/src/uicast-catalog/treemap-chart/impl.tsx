import { createComponentImplementation } from "@uicast/react";
import { Skeleton } from "../../components/ui/skeleton";
import { busy, cn } from "../../lib/utils";
import { Treemap, ResponsiveContainer, Tooltip } from "recharts";
import { defaultChartColors } from "../../lib/chart-colors";
import { TreemapChartDef } from "./def";

const defaultColors = [...defaultChartColors, "#ff6b6b", "#a855f7"];

const CustomContent = (props: Record<string, unknown>) => {
  const { x, y, width, height, name, index } = props as {
    x: number;
    y: number;
    width: number;
    height: number;
    name: string;
    index: number;
  };

  if (width < 30 || height < 20) return null;

  return (
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
      {width > 50 && height > 25 && (
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
};

export const TreemapChartImpl = createComponentImplementation({
  def: TreemapChartDef,
  render: ({ data = [], height}, { entry, loading }) => {
    return (
      <div className={cn("w-full min-w-0", busy(loading))} aria-busy={loading || undefined} data-key={entry.key}>
        <ResponsiveContainer width="100%" height={height}>
          <Treemap
            isAnimationActive={false}
            data={data}
            dataKey="value"
            nameKey="name"
            content={<CustomContent />}
          >
            <Tooltip />
          </Treemap>
        </ResponsiveContainer>
      </div>
    );
  },
  placeholder: () => <Skeleton className="w-full" style={{ height: 300 }} />,
});
