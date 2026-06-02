import z from "zod";
import { createAIComponentDef } from "@ui-fired/core/render/createAIComponentDef";

export const ComboChartDef = createAIComponentDef({
  name: "ComboChart",
  description:
    "A combined bar + line chart for comparing different data types on the same axes. Renders bars and lines together. Use ComboChart for revenue (bars) vs growth rate (line), quantity vs price, or any mixed metric visualization.",
  props: z.strictObject({
    data: z
      .array(
        z.record(
          z.string(),
          z.union([z.string(), z.number(), z.boolean()]).nullable(),
        ),
      )
      .meta({
        description: "Array of data objects",
      }),
    xKey: z.string().meta({ description: "Key for x-axis labels" }),
    barKeys: z.array(z.string()).meta({
      description: "Keys for bar series, e.g. ['revenue']",
    }),
    lineKeys: z.array(z.string()).meta({
      description: "Keys for line series, e.g. ['growthRate']",
    }),
    barColors: z.array(z.string()).optional().meta({
      description: "Colors for bar series",
    }),
    lineColors: z.array(z.string()).optional().meta({
      description: "Colors for line series",
    }),
    height: z
      .number()
      .default(300)
      .meta({ description: "Chart height in pixels" }),
  }),
});
