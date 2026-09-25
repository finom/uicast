import z from "zod";
import { createComponentDefinition } from "@uicast/core";
import { chartColorSchema } from "../../lib/chart-colors";

export const ComboChartDef = createComponentDefinition({
  name: "ComboChart",
  description:
    "A combined bar + line chart for comparing different data types on the same axes. Renders bars and lines together. Use ComboChart for revenue (bars) vs growth rate (line), quantity vs price, or any mixed metric visualization.",
  props: z.strictObject({
    data: z.array(z.record(z.string(), z.union([z.string(), z.number(), z.boolean()]).nullable())).meta({
      description: "Array of data objects",
    }),
    xKey: z.string().meta({ description: "Key for x-axis labels" }),
    barKeys: z.array(z.string()).meta({
      description: "Keys for bar series, e.g. ['revenue']",
    }),
    lineKeys: z.array(z.string()).meta({
      description: "Keys for line series, e.g. ['growthRate']",
    }),
    barColors: z.array(chartColorSchema).optional().meta({ description: "One colour per series, in order." }),
    lineColors: z.array(chartColorSchema).optional().meta({ description: "One colour per series, in order." }),
    height: z.number().int().positive().default(300).meta({ description: "Chart height in pixels" }),
  }),
});
