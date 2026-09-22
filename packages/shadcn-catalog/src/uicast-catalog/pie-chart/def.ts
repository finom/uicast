import z from "zod";
import { createComponentDefinition } from "@uicast/core";
import { chartColorSchema } from "../../lib/chart-colors";

export const PieChartDef = createComponentDefinition({
  name: "PieChart",
  description:
    "A pie/donut chart for visualizing proportions and parts-of-a-whole relationships. Use PieChart for market share, budget breakdown, category distribution, etc. The 'data' prop is an array of objects with 'name' (string) and 'value' (number) keys. Set 'donut' to true for a donut chart with a hole in the center.",
  props: z.strictObject({
    data: z
      .array(
        z.strictObject({
          name: z.string().meta({ description: "The label for this slice" }),
          value: z
            .number()
            .meta({ description: "The numeric value for this slice." }),
        }),
      )
      .meta({ description: "Array of data objects with name and value" }),
    colors: z.array(chartColorSchema).optional().meta({ description: "One colour per series, in order." }),
    height: z
      .number().int().positive()
      .default(300)
      .meta({ description: "Chart height in pixels" }),
    donut: z.boolean().default(false).meta({
      description:
        "Whether to render as a donut chart (with a hole in the center)",
    }),
    showLabels: z
      .boolean()
      .default(true)
      .meta({ description: "Whether to show labels on each slice" }),
    centerLabel: z
      .string()
      .optional()
      .meta({ description: "Text in the hole of a donut chart, such as a total. Ignored unless `donut` is true." }),
  }),
});
