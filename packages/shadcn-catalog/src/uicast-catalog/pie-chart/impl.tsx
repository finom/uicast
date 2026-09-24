import { createComponentImplementation } from "@uicast/react";
import { Skeleton } from "../../components/ui/skeleton";
import { busy, cn } from "../../lib/utils";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { CHART_COLORS, defaultChartColors } from "../../lib/chart-colors";
import { PieChartDef } from "./def";

export const PieChartImpl = createComponentImplementation({
  def: PieChartDef,
  render: ({
    data,
    colors,
    height,
    donut,
    showLabels,
    centerLabel,
  }, { entry, loading }) => {
    const defaultColors = [
      ...defaultChartColors,
      "#ffbb28",
      "#ff8042",
      "#a4de6c",
      "#d0ed57",
    ];
    const sliceColors = colors?.map((c) => CHART_COLORS[c]) ?? defaultColors;
    return (
      <div className={cn("relative w-full min-w-0", busy(loading))} aria-busy={loading || undefined} data-key={entry.key}>
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
                  ? ({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
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
        {donut && centerLabel && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-semibold">{centerLabel}</span>
          </div>
        )}
      </div>
    );
  },
  skeleton: () => <Skeleton className="w-full" style={{ height: 300 }} />,
});
