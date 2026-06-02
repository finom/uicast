import z from "zod";
import { createAIComponentDef } from "ui-fired/core/render/createAIComponentDef";

export const FunnelChartDef = createAIComponentDef({
  name: "FunnelChart",
  description:
    "A funnel chart for visualizing stages in a pipeline or conversion process. Each stage is narrower than the previous one. Use FunnelChart for sales funnels, conversion funnels, recruitment pipelines, or any sequential stage-based data. The 'data' prop is an array of objects with 'name' (string) and 'value' (number) keys, ordered from largest (top) to smallest (bottom).",
  props: z.strictObject({
    data: z
      .array(
        z.object({
          name: z
            .string()
            .meta({ description: "The label for this funnel stage" }),
          value: z
            .number()
            .meta({ description: "The numeric value for this stage" }),
        }),
      )
      .meta({
        description:
          "Array of stage data, ordered from widest (first stage) to narrowest (last stage)",
      }),
    colors: z.array(z.string()).optional().meta({
      description: "Optional hex color strings for each stage",
    }),
    height: z
      .number()
      .default(300)
      .meta({ description: "Chart height in pixels" }),
  }),
});
