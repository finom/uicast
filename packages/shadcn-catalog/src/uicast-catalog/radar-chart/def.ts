import z from "zod";
import { createComponentDefinition } from "@uicast/core";
import { chartColorSchema } from "../../lib/chart-colors";

export const RadarChartDef = createComponentDefinition({
  name: "RadarChart",
  description:
    "A radar/spider chart for multivariate data comparison. Displays data across multiple axes radiating from a center point. Use RadarChart for skill assessments, product comparisons, performance metrics, or any multi-dimensional analysis.",
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
          "Array of data objects, e.g. [{subject: 'Math', score: 80}, ...]",
      }),
    dataKey: z
      .string()
      .meta({ description: "Key for the axis label in data objects" }),
    valueKeys: z.array(z.string()).meta({
      description:
        "Array of keys for values to plot, e.g. ['score', 'average']",
    }),
    colors: z.array(chartColorSchema).optional().meta({ description: "One colour per series, in order." }),
    height: z
      .number().int().positive()
      .default(300)
      .meta({ description: "Chart height in pixels" }),
  }),
});
