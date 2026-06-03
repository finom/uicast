import { createAIComponentRenderer } from "@ui-fired/react";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { PieChartDef } from "./def";

export const PieChartRenderer = createAIComponentRenderer({
  def: PieChartDef,
  renderer: ({
    data: rawData = [],
    colors,
    height = 300,
    donut = false,
    showLabels = true,
    generatedKey,
  }) => {
    const data = rawData.map((d) => ({ ...d, value: Number(d.value) }));
    const defaultColors = [
      "#8884d8",
      "#82ca9d",
      "#ffc658",
      "#ff7300",
      "#0088fe",
      "#00c49f",
      "#ffbb28",
      "#ff8042",
      "#a4de6c",
      "#d0ed57",
    ];
    const sliceColors = colors ?? defaultColors;
    return (
      <ResponsiveContainer width="100%" height={height} data-key={generatedKey}>
        <RechartsPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={donut ? "40%" : 0}
            outerRadius="80%"
            dataKey="value"
            nameKey="name"
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            label={
              showLabels
                ? (((props: any) =>
                    `${String(props.name ?? "")} ${(Number(props.percent ?? 0) * 100).toFixed(0)}%`) as never)
                : undefined
            }
          >
            {data.map((_entry, i) => (
              <Cell key={i} fill={sliceColors[i % sliceColors.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </RechartsPieChart>
      </ResponsiveContainer>
    );
  },
});
