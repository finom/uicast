import z from "zod";
import { createComponentDefinition } from "@uicast/core";
import { chartColorSchema } from "../../lib/chart-colors";

export const ScatterChartDef = createComponentDefinition({
  name: "ScatterChart",
  description:
    "A scatter plot for visualizing correlation between two numeric variables. Each point represents a data observation. Use ScatterChart for analyzing relationships, distribution patterns, outlier detection, or comparing two metrics (height vs weight, price vs quantity, etc.). With `sizeKey`, each point's size shows a third value: a bubble chart.",
  props: z.strictObject({
    data: z.array(z.record(z.string(), z.union([z.string(), z.number(), z.boolean()]).nullable())).meta({
      description: "Array of data objects, e.g. [{x: 100, y: 200, name: 'A'}, ...]",
    }),
    xKey: z.string().meta({ description: "The key for x-axis values" }),
    yKey: z.string().meta({ description: "The key for y-axis values" }),
    sizeKey: z.string().optional().meta({ description: "The key for point sizes" }),
    name: z.string().optional().meta({ description: "Series name, shown in the tooltip." }),
    color: chartColorSchema.default("violet").meta({ description: "Dot color." }),
    height: z.number().int().positive().default(300).meta({ description: "Chart height in pixels" }),
  }),
});
