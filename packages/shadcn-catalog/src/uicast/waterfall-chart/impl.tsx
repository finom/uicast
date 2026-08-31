import { createComponentImplementation } from "@uicast/react";
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

export const WaterfallChartImpl = createComponentImplementation({
  def: WaterfallChartDef,
  render: ({
    data = [],
    height,
    positiveColor,
    negativeColor,
    totalColor,
    generatedKey,
  }) => {
    let running = 0;
    const processedData = data.map((item) => {
      if (item.isTotal) {
        const total = running;
        return {
          name: item.name,
          base: 0,
          value: total,
          rawValue: total,
          type: "total" as const,
        };
      }
      const base = running;
      running += item.value;
      return {
        name: item.name,
        base: item.value >= 0 ? base : base + item.value,
        value: Math.abs(item.value),
        rawValue: item.value,
        type: (item.value >= 0 ? "positive" : "negative") as
          | "positive"
          | "negative",
      };
    });

    return (
      <ResponsiveContainer width="100%" height={height} data-key={generatedKey}>
        <BarChart data={processedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip
            formatter={(val, name) => {
              if (name === "base") return [undefined, undefined];
              return [val, "Value"];
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
            {processedData.map((entry, i) => (
              <Cell
                key={i}
                fill={
                  entry.type === "total"
                    ? totalColor
                    : entry.type === "positive"
                      ? positiveColor
                      : negativeColor
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  },
});
