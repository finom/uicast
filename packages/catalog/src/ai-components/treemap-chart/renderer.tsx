import { createAIComponentRenderer } from "@ui-fired/react";
import { Treemap, ResponsiveContainer, Tooltip } from "recharts";
import { TreemapChartDef } from "./def";

const defaultColors = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7300",
  "#0088fe",
  "#00c49f",
  "#ff6b6b",
  "#a855f7",
];

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

export const TreemapChartRenderer = createAIComponentRenderer({
  def: TreemapChartDef,
  renderer: ({ data = [], height = 300, generatedKey }) => {
    return (
      <ResponsiveContainer width="100%" height={height} data-key={generatedKey}>
        <Treemap
          data={data}
          dataKey="value"
          nameKey="name"
          content={<CustomContent />}
        >
          <Tooltip />
        </Treemap>
      </ResponsiveContainer>
    );
  },
});
