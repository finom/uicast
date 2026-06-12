import { createAIComponentRenderer } from "@ui-fired/react";
import {
  LineChart,
  Line,
  Area,
  AreaChart,
  ResponsiveContainer,
} from "recharts";
import { SparklineDef } from "./def";

export const SparklineRenderer = createAIComponentRenderer({
  def: SparklineDef,
  renderer: ({
    data = [],
    width = 100,
    height = 30,
    color = "#8884d8",
    filled = false,
    generatedKey,
  }) => {
    const chartData = data.map((value, i) => ({ i, value }));

    return (
      <div
        className="inline-flex items-center"
        style={{ width, height }}
        data-key={generatedKey}
      >
        <ResponsiveContainer width="100%" height="100%">
          {filled ? (
            <AreaChart data={chartData}>
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                fill={color}
                fillOpacity={0.2}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          ) : (
            <LineChart data={chartData}>
              <Line
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    );
  },
});
