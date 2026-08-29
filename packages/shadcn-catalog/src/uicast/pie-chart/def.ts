import z from "zod";
import { createComponentDefinition } from "@uicast/core";

export const PieChartDef = createComponentDefinition({
  name: "PieChart",
  description:
    "A pie/donut chart for visualizing proportions and parts-of-a-whole relationships. Use PieChart for market share, budget breakdown, category distribution, etc. The 'data' prop is an array of objects with 'name' (string) and 'value' (number) keys. Set 'donut' to true for a donut chart with a hole in the center.",
  props: z.object({
    data: z
      .array(
        z.object({
          name: z.string().meta({ description: "The label for this slice" }),
          value: z
            .number()
            .meta({ description: "The numeric value for this slice." }),
        }),
      )
      .meta({ description: "Array of data objects with name and value" }),
    colors: z.array(z.string()).optional().meta({
      description:
        "Optional hex color strings for each slice, e.g. ['#8884d8', '#82ca9d']",
    }),
    height: z
      .number()
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
  }),
});
