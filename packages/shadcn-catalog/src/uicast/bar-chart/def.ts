import z from "zod";
import { createComponentDefinition } from "@uicast/core";

export const BarChartDef = createComponentDefinition({
  name: "BarChart",
  description:
    "A bar chart for visualizing categorical data with rectangular bars. Each bar represents a data value. Use BarChart for comparing quantities across categories (sales by month, revenue by product, etc.). The 'data' prop is an array of objects, 'xKey' is the key for x-axis labels, and 'yKeys' are the keys for bar values. Values for yKeys must be numbers. Each yKey creates a set of bars with an auto-assigned color.",
  props: z.object({
    data: z
      .array(
        z.record(
          z.string(),
          z.union([z.string(), z.number(), z.boolean()]).nullable(),
        ),
      )
      .meta({
        description:
          "Array of data objects, e.g. [{month: 'Jan', sales: 100}, ...]",
      }),
    xKey: z
      .string()
      .meta({ description: "The key in data objects for x-axis labels" }),
    yKeys: z.array(z.string()).meta({
      description:
        "Array of keys in data objects for bar values, e.g. ['sales', 'profit']",
    }),
    colors: z.array(z.string()).optional().meta({
      description:
        "Optional array of hex color strings for each bar series, e.g. ['#8884d8', '#82ca9d']",
    }),
    height: z
      .number()
      .default(300)
      .meta({ description: "Chart height in pixels" }),
    stacked: z.boolean().default(false).meta({
      description: "Whether bars should be stacked on top of each other",
    }),
  }),
});
