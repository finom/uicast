import { createComponentImplementation } from "@uicast/react";
import { Skeleton } from "../../components/ui/skeleton";
import { busy, cn } from "../../lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import { WaterfallChartDef } from "./def";
import { CHART_COLORS } from "../../lib/chart-colors";

export const WaterfallChartImpl = createComponentImplementation({
  def: WaterfallChartDef,
  render: ({
    data,
    height,
    positiveColor,
    negativeColor,
    totalColor,
  }, { entry, loading }) => {
    const barColors = { total: totalColor, positive: positiveColor, negative: negativeColor };
    let running = 0;
    const processedData = data.map((item) => {
      if (item.isTotal) {
        return {
          name: item.name,
          base: 0,
          value: running,
          signedValue: running,
          type: "total" as const,
        };
      }
      const base = running;
      running += item.value;
      return {
        name: item.name,
        base: item.value >= 0 ? base : base + item.value,
        value: Math.abs(item.value),
        signedValue: item.value,
        type: (item.value >= 0 ? "positive" : "negative") as
          | "positive"
          | "negative",
      };
    });

    return (
      <div className={cn("w-full min-w-0", busy(loading))} aria-busy={loading || undefined} data-key={entry.key}>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={processedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip
              formatter={(_, name, item) => {
                if (name === "base") return [undefined, undefined];
                return [item.payload.signedValue, "Value"];
              }}
            />
            <ReferenceLine y={0} stroke="#666" />
            <Bar
              isAnimationActive={false}
              dataKey="base"
              stackId="waterfall"
              fill="transparent"
            />
            <Bar isAnimationActive={false} dataKey="value" stackId="waterfall">
              {processedData.map((bar, i) => (
                <Cell key={i} fill={CHART_COLORS[barColors[bar.type]]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  },
  skeleton: () => <Skeleton className="w-full" style={{ height: 300 }} />,
});
