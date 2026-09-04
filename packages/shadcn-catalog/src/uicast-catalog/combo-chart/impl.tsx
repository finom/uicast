import { createComponentImplementation } from "@uicast/react";
import { Skeleton } from "../../components/ui/skeleton";
import { busy, cn } from "../../lib/utils";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { defaultChartColors } from "../../lib/chart-colors";
import { ComboChartDef } from "./def";

export const ComboChartImpl = createComponentImplementation({
  def: ComboChartDef,
  render: ({
    data = [],
    xKey,
    barKeys = [],
    lineKeys = [],
    barColors,
    lineColors,
    height,
  }, { entry, loading }) => {
    const bColors = barColors ?? defaultChartColors.slice(0, 3);
    const lColors = lineColors ?? defaultChartColors.slice(3);

    return (
      <div className={cn("w-full min-w-0", busy(loading))} aria-busy={loading || undefined} data-key={entry.key}>
        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            {barKeys.map((key, i) => (
              <Bar isAnimationActive={false} key={key} dataKey={key} fill={bColors[i % bColors.length]} />
            ))}
            {lineKeys.map((key, i) => (
              <Line isAnimationActive={false}
                key={key}
                type="monotone"
                dataKey={key}
                stroke={lColors[i % lColors.length]}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    );
  },
  placeholder: () => <Skeleton className="w-full" style={{ height: 300 }} />,
});
