import z from "zod";
import { createComponentDefinition } from "@ui-fired/core/render/create-component-definition";

export const HeatmapDef = createComponentDefinition({
  name: "Heatmap",
  description:
    "A heatmap for visualizing matrix data with color intensity. Renders a grid of colored cells based on values. Use Heatmap for correlation matrices, activity calendars, hour-by-day usage patterns, geographic intensity, etc.",
  props: z.strictObject({
    data: z
      .array(
        z.object({
          row: z.string().meta({ description: "Row label" }),
          col: z.string().meta({ description: "Column label" }),
          value: z
            .number()
            .meta({ description: "Cell value determining color intensity" }),
        }),
      )
      .meta({ description: "Array of cell data with row, col, and value" }),
    rows: z.array(z.string()).meta({ description: "Row labels in order" }),
    cols: z.array(z.string()).meta({ description: "Column labels in order" }),
    minColor: z
      .string()
      .default("#f0f9ff")
      .meta({ description: "Color for minimum value" }),
    maxColor: z
      .string()
      .default("#1e40af")
      .meta({ description: "Color for maximum value" }),
    showValues: z
      .boolean()
      .default(true)
      .meta({ description: "Whether to show values in cells" }),
  }),
});
