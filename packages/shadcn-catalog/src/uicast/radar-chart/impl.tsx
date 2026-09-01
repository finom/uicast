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
import { defaultChartColors } from "../../lib/chart-colors";
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
    const radarColors = colors ?? defaultChartColors;

    return (
      <div className="w-full min-w-0" data-key={generatedKey}>
        <ResponsiveContainer width="100%" height={height}>
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
      </div>
    );
  },
});
