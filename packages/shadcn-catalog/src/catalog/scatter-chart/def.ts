import z from "zod";
import { createComponentDefinition } from "@ui-fired/core";

export const ScatterChartDef = createComponentDefinition({
  name: "ScatterChart",
  description:
    "A scatter plot for visualizing correlation between two numeric variables. Each point represents a data observation. Use ScatterChart for analyzing relationships, distribution patterns, outlier detection, or comparing two metrics (height vs weight, price vs quantity, etc.).",
  props: z.strictObject({
    data: z
      .array(
        z.record(
          z.string(),
          z.union([z.string(), z.number(), z.boolean()]).nullable(),
        ),
      )
      .meta({
        description:
          "Array of data objects, e.g. [{x: 100, y: 200, name: 'A'}, ...]",
      }),
    xKey: z.string().meta({ description: "The key for x-axis values" }),
    yKey: z.string().meta({ description: "The key for y-axis values" }),
    nameKey: z
      .string()
      .optional()
      .meta({ description: "Optional key for point labels" }),
    color: z.string().default("#8884d8").meta({ description: "Dot color" }),
    height: z
      .number()
      .default(300)
      .meta({ description: "Chart height in pixels" }),
  }),
});
