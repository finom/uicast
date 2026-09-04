import { createComponentImplementation } from "@uicast/react";
import { Skeleton } from "../../components/ui/skeleton";
import { busy, cn } from "../../lib/utils";
import {
  ScatterChart as RechartsScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ScatterChartDef } from "./def";
import { CHART_COLORS } from "../../lib/chart-colors";

export const ScatterChartImpl = createComponentImplementation({
  def: ScatterChartDef,
  render: ({
    data = [],
    xKey,
    yKey,
    nameKey,
    color,
    height,
  }, { entry, loading }) => {
    return (
      <div className={cn("w-full min-w-0", busy(loading))} aria-busy={loading || undefined} data-key={entry.key}>
        <ResponsiveContainer width="100%" height={height}>
          <RechartsScatterChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} type="number" name={xKey} />
            <YAxis dataKey={yKey} type="number" name={yKey} />
            <Tooltip cursor={{ strokeDasharray: "3 3" }} />
            <Scatter isAnimationActive={false} name={nameKey ?? "Data"} data={data} fill={CHART_COLORS[color]} />
          </RechartsScatterChart>
        </ResponsiveContainer>
      </div>
    );
  },
  placeholder: () => <Skeleton className="w-full" style={{ height: 300 }} />,
});
