import z from "zod";
import { createComponentDefinition } from "@uicast/core";

export const BubbleChartDef = createComponentDefinition({
  name: "BubbleChart",
  description:
    "A bubble chart for three-dimensional data visualization. Like scatter but with a third dimension represented by bubble size. Use BubbleChart for market analysis, portfolio visualization, population studies, or any 3-variable comparison.",
  props: z.strictObject({
    data: z
      .array(
        z.object({
          x: z.number().meta({ description: "X-axis value" }),
          y: z.number().meta({ description: "Y-axis value" }),
          z: z.number().meta({ description: "Bubble size value" }),
          name: z.string().optional().meta({ description: "Point label" }),
        }),
      )
      .meta({ description: "Array of bubble data points" }),
    xLabel: z.string().optional().meta({ description: "X-axis label" }),
    yLabel: z.string().optional().meta({ description: "Y-axis label" }),
    color: z.string().default("#8884d8").meta({ description: "Bubble color" }),
    height: z
      .number()
      .default(300)
      .meta({ description: "Chart height in pixels" }),
  }),
});
