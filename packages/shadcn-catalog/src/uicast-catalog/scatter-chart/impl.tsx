import { createComponentImplementation } from "@uicast/react";
import { CartesianGrid, ScatterChart as RechartsScatterChart, Scatter, Tooltip, XAxis, YAxis, ZAxis } from "recharts";
import { ChartFrame } from "../../lib/chart-frame";
import { CHART_COLORS } from "../../lib/chart-colors";
import { blockSkeleton } from "../../lib/skeletons";
import { ScatterChartDef } from "./def";

export const ScatterChartImpl = createComponentImplementation({
  def: ScatterChartDef,
  render: ({ data, xKey, yKey, sizeKey, name, color, height }, { entry, loading }) => (
    <ChartFrame entry={entry} loading={loading} height={height}>
      <RechartsScatterChart aria-label="Scatter chart">
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xKey} type="number" name={xKey} />
        <YAxis dataKey={yKey} type="number" name={yKey} />
        {sizeKey && <ZAxis dataKey={sizeKey} name={sizeKey} range={[40, 400]} domain={["dataMin", "dataMax"]} />}
        <Tooltip cursor={{ strokeDasharray: "3 3" }} />
        <Scatter
          isAnimationActive={false}
          name={name ?? "Data"}
          data={data}
          fill={CHART_COLORS[color]}
          fillOpacity={sizeKey ? 0.6 : 1}
        />
      </RechartsScatterChart>
    </ChartFrame>
  ),
  skeleton: blockSkeleton(300),
});
