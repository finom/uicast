import { createComponentImplementation } from "@uicast/react";
import { CartesianGrid, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";
import { ChartFrame } from "../../lib/chart-frame";
import { CHART_COLORS } from "../../lib/chart-colors";
import { blockSkeleton } from "../../lib/skeletons";
import { BubbleChartDef } from "./def";

export const BubbleChartImpl = createComponentImplementation({
  def: BubbleChartDef,
  render: ({ data, xLabel, yLabel, color, height }, { entry, loading }) => {
    const zValues = data.map((d) => d.z);
    const zRange: [number, number] = [Math.min(...zValues), Math.max(...zValues) || 100];
    return (
      <ChartFrame entry={entry} loading={loading} height={height}>
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="x" type="number" />
          <YAxis dataKey="y" type="number" />
          <ZAxis dataKey="z" range={[40, 400]} domain={zRange} />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            content={({ payload }) => {
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
          <Scatter isAnimationActive={false} data={data} fill={CHART_COLORS[color]} fillOpacity={0.6} />
        </ScatterChart>
      </ChartFrame>
    );
  },
  skeleton: blockSkeleton(300),
});
