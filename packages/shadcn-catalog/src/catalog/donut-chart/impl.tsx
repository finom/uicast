import { createComponentImplementation } from "@ui-fired/react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { DonutChartDef } from "./def";

export const DonutChartImpl = createComponentImplementation({
  def: DonutChartDef,
  render: ({
    data = [],
    height = 300,
    innerRadius = 60,
    outerRadius = 100,
    centerLabel,
    generatedKey,
  }) => {
    const defaultColors = [
      "#8884d8",
      "#82ca9d",
      "#ffc658",
      "#ff7300",
      "#0088fe",
      "#00c49f",
      "#ff6b6b",
    ];

    return (
      <div className="relative" data-key={generatedKey}>
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
            >
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.color ?? defaultColors[i % defaultColors.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
        {centerLabel && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-lg font-semibold">{centerLabel}</span>
          </div>
        )}
      </div>
    );
  },
});
