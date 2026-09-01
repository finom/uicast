import { createComponentImplementation } from "@uicast/react";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { defaultChartColors } from "../../lib/chart-colors";
import { PieChartDef } from "./def";

export const PieChartImpl = createComponentImplementation({
  def: PieChartDef,
  render: ({
    data: rawData = [],
    colors,
    height,
    donut,
    showLabels,
    generatedKey,
  }) => {
    const data = rawData.map((d) => ({ ...d, value: Number(d.value) }));
    const defaultColors = [
      ...defaultChartColors,
      "#ffbb28",
      "#ff8042",
      "#a4de6c",
      "#d0ed57",
    ];
    const sliceColors = colors ?? defaultColors;
    return (
      <div className="w-full min-w-0" data-key={generatedKey}>
        <ResponsiveContainer width="100%" height={height}>
          <RechartsPieChart>
            <Pie isAnimationActive={false}
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={donut ? "40%" : 0}
              outerRadius="80%"
              dataKey="value"
              nameKey="name"
              label={
                showLabels
                  ? (((props: { name?: unknown; percent?: unknown }) =>
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
      </div>
    );
  },
});
