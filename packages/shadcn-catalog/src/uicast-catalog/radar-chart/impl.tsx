import { createComponentImplementation } from "@uicast/react";
import { Skeleton } from "../../components/ui/skeleton";
import { busy, cn } from "../../lib/utils";
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
import { CHART_COLORS, defaultChartColors } from "../../lib/chart-colors";
import { RadarChartDef } from "./def";

export const RadarChartImpl = createComponentImplementation({
  def: RadarChartDef,
  render: ({
    data = [],
    dataKey,
    valueKeys = [],
    colors,
    height,
  }, { entry, loading }) => {
    const radarColors = colors?.map((c) => CHART_COLORS[c]) ?? defaultChartColors;

    return (
      <div className={cn("w-full min-w-0", busy(loading))} aria-busy={loading || undefined} data-key={entry.key}>
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
  placeholder: () => <Skeleton className="w-full" style={{ height: 300 }} />,
});
