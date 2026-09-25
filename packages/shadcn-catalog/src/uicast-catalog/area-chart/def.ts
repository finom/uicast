import z from "zod";
import { createComponentDefinition } from "@uicast/core";
import { chartColorSchema } from "../../lib/chart-colors";

export const AreaChartDef = createComponentDefinition({
  name: "AreaChart",
  description:
    "An area chart for visualizing data trends with filled areas below the lines. Combines the trend visualization of a line chart with the volume emphasis of filled areas. Use AreaChart for revenue over time, cumulative metrics, stacked comparisons, etc. The 'data' prop is an array of objects, 'xKey' is the key for x-axis labels, and 'yKeys' are the keys for area values.",
  props: z.strictObject({
    data: z.array(z.record(z.string(), z.union([z.string(), z.number(), z.boolean()]).nullable())).meta({
      description: "Array of data objects, e.g. [{date: 'Jan', revenue: 100}, ...]",
    }),
    xKey: z.string().meta({
      description: "The key in data objects for x-axis labels",
    }),
    yKeys: z.array(z.string()).meta({
      description: "Array of keys for area values, e.g. ['revenue', 'cost']",
    }),
    colors: z.array(chartColorSchema).optional().meta({ description: "One colour per series, in order." }),
    height: z.number().int().positive().default(300).meta({
      description: "Chart height in pixels",
    }),
    stacked: z.boolean().default(false).meta({
      description: "Whether areas should be stacked on top of each other",
    }),
    curved: z.boolean().default(true).meta({
      description: "Whether area edges are curved (monotone) or straight (linear)",
    }),
  }),
});
