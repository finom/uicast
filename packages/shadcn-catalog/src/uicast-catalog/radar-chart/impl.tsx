import { createComponentImplementation } from "@uicast/react";
import { Legend, PolarAngleAxis, PolarGrid, Radar, RadarChart as RechartsRadarChart, Tooltip } from "recharts";
import { ChartFrame } from "../../lib/chart-frame";
import { chartColors } from "../../lib/chart-colors";
import { blockSkeleton } from "../../lib/skeletons";
import { RadarChartDef } from "./def";

export const RadarChartImpl = createComponentImplementation({
  def: RadarChartDef,
  render: ({ data, dataKey, valueKeys, colors, height }, { entry, loading }) => {
    const palette = chartColors(colors);
    return (
      <ChartFrame entry={entry} loading={loading} height={height}>
        <RechartsRadarChart data={data} aria-label="Radar chart">
          <PolarGrid />
          <PolarAngleAxis dataKey={dataKey} />
          <Tooltip />
          <Legend />
          {valueKeys.map((key, i) => (
            <Radar
              isAnimationActive={false}
              key={key}
              name={key}
              dataKey={key}
              stroke={palette[i % palette.length]}
              fill={palette[i % palette.length]}
              fillOpacity={0.3}
            />
          ))}
        </RechartsRadarChart>
      </ChartFrame>
    );
  },
  skeleton: blockSkeleton(300),
});
