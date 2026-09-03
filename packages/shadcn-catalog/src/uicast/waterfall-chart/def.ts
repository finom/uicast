import z from "zod";
import { createComponentDefinition } from "@uicast/core";
import { chartColorSchema } from "../../lib/chart-colors";

export const WaterfallChartDef = createComponentDefinition({
  name: "WaterfallChart",
  description:
    "A waterfall chart showing cumulative effect of sequential positive/negative values. Each bar starts where the previous one ended. Use WaterfallChart for financial statements, profit/loss breakdown, budget variance analysis, etc.",
  props: z.strictObject({
    data: z
      .array(
        z.strictObject({
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
      .number().int().positive()
      .default(300)
      .meta({ description: "Chart height in pixels" }),
    positiveColor: chartColorSchema
      .default("green")
      .meta({ description: "Color for positive values" }),
    negativeColor: chartColorSchema
      .default("red")
      .meta({ description: "Color for negative values" }),
    totalColor: chartColorSchema
      .default("blue")
      .meta({ description: "Color for total bars" }),
  }),
});
