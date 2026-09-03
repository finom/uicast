import { createComponentImplementation } from "@uicast/react";
import { busy, cn } from "../../lib/utils";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { defaultChartColors } from "../../lib/chart-colors";
import { DonutChartDef } from "./def";

export const DonutChartImpl = createComponentImplementation({
  def: DonutChartDef,
  render: ({
    data = [],
    height,
    innerRadius,
    outerRadius,
    centerLabel,
  }, { entry, loading }) => {
    const defaultColors = [...defaultChartColors, "#ff6b6b"];
    const color = (i: number) => data[i].color ?? defaultColors[i % defaultColors.length];
    // The ring must fit the chart box; the legend sits below it, in its own space.
    const outer = Math.min(outerRadius, height / 2 - 4);
    const inner = Math.min(innerRadius, outer - 8);

    return (
      <div className={cn("w-full min-w-0", busy(loading))} aria-busy={loading || undefined} data-key={entry.key}>
        <div className="relative" style={{ height }}>
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                isAnimationActive={false}
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={inner}
                outerRadius={outer}
              >
                {data.map((entry, i) => (
                  <Cell key={entry.name} fill={color(i)} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          {centerLabel && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-semibold">{centerLabel}</span>
            </div>
          )}
        </div>
        <ul className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1 text-sm">
          {data.map((entry, i) => (
            <li key={entry.name} className="flex items-center gap-1.5">
              <span className="size-3 shrink-0 rounded-sm" style={{ background: color(i) }} />
              {entry.name}
            </li>
          ))}
        </ul>
      </div>
    );
  },
});
