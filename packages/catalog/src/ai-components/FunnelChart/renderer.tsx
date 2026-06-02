import { createAIComponentRenderer } from "@ui-fired/core/render/createAIComponentRenderer";
import {
  FunnelChart as RechartsFunnelChart,
  Funnel,
  Tooltip,
  LabelList,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { FunnelChartDef } from "./def";

export const FunnelChartRenderer = createAIComponentRenderer({
  def: FunnelChartDef,
  renderer: ({ data = [], colors, height = 300, generatedKey }) => {
    const defaultColors = [
      "#8884d8",
      "#83a6ed",
      "#8dd1e1",
      "#82ca9d",
      "#a4de6c",
      "#d0ed57",
      "#ffc658",
      "#ff8042",
      "#ff7300",
      "#ff0000",
    ];
    const stageColors = colors ?? defaultColors;
    const dataWithFill = data.map((d, i) => ({
      ...d,
      fill: stageColors[i % stageColors.length],
    }));
    return (
      <ResponsiveContainer width="100%" height={height} data-key={generatedKey}>
        <RechartsFunnelChart>
          <Tooltip />
          <Funnel dataKey="value" data={dataWithFill} isAnimationActive>
            <LabelList
              position="right"
              fill="#000"
              stroke="none"
              dataKey="name"
            />
            {dataWithFill.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Funnel>
        </RechartsFunnelChart>
      </ResponsiveContainer>
    );
  },
});
