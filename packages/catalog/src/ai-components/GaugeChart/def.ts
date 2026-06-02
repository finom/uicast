import z from "zod";
import { createAIComponentDef } from "@ui-fired/core/render/createAIComponentDef";

export const GaugeChartDef = createAIComponentDef({
  name: "GaugeChart",
  description:
    "A gauge/meter chart for single value progress display. Shows a value on a semicircular scale. Use GaugeChart for KPIs, progress metrics, speedometers, performance scores, etc.",
  props: z.strictObject({
    value: z.number().meta({ description: "Current value" }),
    min: z.number().default(0).meta({ description: "Minimum value" }),
    max: z.number().default(100).meta({ description: "Maximum value" }),
    label: z
      .string()
      .optional()
      .meta({ description: "Label text beneath the value" }),
    color: z
      .string()
      .default("#8884d8")
      .meta({ description: "Gauge fill color" }),
    height: z
      .number()
      .default(200)
      .meta({ description: "Chart height in pixels" }),
  }),
});
