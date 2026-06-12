import z from "zod";
import { createAIComponentDef } from "@ui-fired/core/render/create-ai-component-def";

export const DonutChartDef = createAIComponentDef({
  name: "DonutChart",
  description:
    "A donut (ring) chart for proportional data display with a center area. Similar to PieChart but with a hollow center that can display summary text. Use DonutChart for budget breakdown, market share, completion percentage, etc.",
  props: z.strictObject({
    data: z
      .array(
        z.object({
          name: z.string().meta({ description: "Segment label" }),
          value: z.number().meta({ description: "Segment value" }),
          color: z
            .string()
            .optional()
            .meta({ description: "Optional segment color" }),
        }),
      )
      .meta({ description: "Array of data segments" }),
    height: z
      .number()
      .default(300)
      .meta({ description: "Chart height in pixels" }),
    innerRadius: z
      .number()
      .default(60)
      .meta({ description: "Inner radius for donut hole" }),
    outerRadius: z.number().default(100).meta({ description: "Outer radius" }),
    centerLabel: z.string().optional().meta({
      description: "Optional text to display in the center of the donut",
    }),
  }),
});
