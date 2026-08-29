import { createComponentImplementation } from "@uicast/react";
import {
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { RadarChartDef } from "./def";

export const RadarChartImpl = createComponentImplementation({
  def: RadarChartDef,
  render: ({
    data = [],
    dataKey,
    valueKeys = [],
    colors,
    height,
    generatedKey,
  }) => {
    const defaultColors = [
      "#8884d8",
      "#82ca9d",
      "#ffc658",
      "#ff7300",
      "#0088fe",
      "#00c49f",
    ];
    const radarColors = colors ?? defaultColors;

    return (
      <ResponsiveContainer width="100%" height={height} data-key={generatedKey}>
        <RechartsRadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey={dataKey} />
          <PolarRadiusAxis />
          <Tooltip />
          <Legend />
          {valueKeys.map((key, i) => (
            <Radar isAnimationActive={false}
              key={key}
              name={key}
              dataKey={key}
              stroke={radarColors[i % radarColors.length]}
              fill={radarColors[i % radarColors.length]}
              fillOpacity={0.3}
            />
          ))}
        </RechartsRadarChart>
      </ResponsiveContainer>
    );
  },
});
