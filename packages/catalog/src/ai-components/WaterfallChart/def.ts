import z from "zod";
import { createAIComponentDef } from "ui-fired/core/render/createAIComponentDef";

export const WaterfallChartDef = createAIComponentDef({
  name: "WaterfallChart",
  description:
    "A waterfall chart showing cumulative effect of sequential positive/negative values. Each bar starts where the previous one ended. Use WaterfallChart for financial statements, profit/loss breakdown, budget variance analysis, etc.",
  props: z.strictObject({
    data: z
      .array(
        z.object({
          name: z.string().meta({ description: "Category label" }),
          value: z
            .number()
            .meta({ description: "Value (positive or negative)" }),
          isTotal: z.boolean().optional().meta({
            description:
              "Whether this bar represents a total (starts from zero)",
          }),
        }),
      )
      .meta({ description: "Array of waterfall data items" }),
    height: z
      .number()
      .default(300)
      .meta({ description: "Chart height in pixels" }),
    positiveColor: z
      .string()
      .default("#82ca9d")
      .meta({ description: "Color for positive values" }),
    negativeColor: z
      .string()
      .default("#ff6b6b")
      .meta({ description: "Color for negative values" }),
    totalColor: z
      .string()
      .default("#8884d8")
      .meta({ description: "Color for total bars" }),
  }),
});
