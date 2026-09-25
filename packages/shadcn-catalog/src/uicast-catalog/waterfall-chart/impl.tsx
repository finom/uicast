import { createComponentImplementation } from "@uicast/react";
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, Tooltip, XAxis, YAxis } from "recharts";
import { ChartFrame } from "../../lib/chart-frame";
import { CHART_COLORS } from "../../lib/chart-colors";
import { blockSkeleton } from "../../lib/skeletons";
import { WaterfallChartDef } from "./def";

export const WaterfallChartImpl = createComponentImplementation({
  def: WaterfallChartDef,
  render: ({ data, height, positiveColor, negativeColor, totalColor }, { entry, loading }) => {
    // Each bar floats on an invisible `base` bar stacked under it.
    let running = 0;
    const bars = data.map(({ name, value, isTotal }) => {
      if (isTotal) return { name, base: 0, value: running, signedValue: running, swatch: totalColor };
      const base = running;
      running += value;
      return value >= 0
        ? { name, base, value, signedValue: value, swatch: positiveColor }
        : { name, base: base + value, value: -value, signedValue: value, swatch: negativeColor };
    });

    return (
      <ChartFrame entry={entry} loading={loading} height={height}>
        <BarChart data={bars}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip
            formatter={(_, name, item) => (name === "base" ? [undefined, undefined] : [item.payload.signedValue, "Value"])}
          />
          <ReferenceLine y={0} stroke="#666" />
          <Bar isAnimationActive={false} dataKey="base" stackId="waterfall" fill="transparent" />
          <Bar isAnimationActive={false} dataKey="value" stackId="waterfall">
            {bars.map((bar, i) => (
              <Cell key={i} fill={CHART_COLORS[bar.swatch]} />
            ))}
          </Bar>
        </BarChart>
      </ChartFrame>
    );
  },
  skeleton: blockSkeleton(300),
});
