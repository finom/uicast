import { createComponentImplementation } from "@uicast/react";
import { Skeleton } from "../../components/ui/skeleton";
import { busy, cn } from "../../lib/utils";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
} from "recharts";
import { BubbleChartDef } from "./def";
import { CHART_COLORS } from "../../lib/chart-colors";

export const BubbleChartImpl = createComponentImplementation({
  def: BubbleChartDef,
  render: ({
    data,
    xLabel,
    yLabel,
    color,
    height,
  }, { entry, loading }) => {
    const zValues = data.map((d) => d.z);
    const zRange: [number, number] = [
      Math.min(...zValues),
      Math.max(...zValues) || 100,
    ];

    return (
      <div className={cn("w-full min-w-0", busy(loading))} aria-busy={loading || undefined} data-key={entry.key}>
        <ResponsiveContainer width="100%" height={height}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="x" type="number" />
            <YAxis dataKey="y" type="number" />
            <ZAxis dataKey="z" range={[40, 400]} domain={zRange} />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              content={(props) => {
                const payload = props.payload;
                if (!payload?.length) return null;
                const d = payload[0].payload as (typeof data)[number];
                return (
                  <div className="rounded-md border bg-background p-2 text-xs shadow-md">
                    {d.name && <p className="font-medium">{d.name}</p>}
                    <p>{xLabel ?? "X"}: {d.x}</p>
                    <p>{yLabel ?? "Y"}: {d.y}</p>
                    <p>Size: {d.z}</p>
                  </div>
                );
              }}
            />
            <Scatter
              isAnimationActive={false}
              data={data}
              fill={CHART_COLORS[color]}
              fillOpacity={0.6}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    );
  },
  placeholder: () => <Skeleton className="w-full" style={{ height: 300 }} />,
});
