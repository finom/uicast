import z from "zod";
import { createAIComponentDef } from "@ui-fired/core/render/createAIComponentDef";

export const TreemapChartDef = createAIComponentDef({
  name: "TreemapChart",
  description:
    "A treemap for hierarchical data as nested rectangles. Each rectangle's area is proportional to its value. Use TreemapChart for disk usage, portfolio allocation, organizational budgets, or hierarchical proportional data.",
  props: z.strictObject({
    data: z
      .array(
        z.object({
          name: z.string().meta({ description: "Item name" }),
          value: z
            .number()
            .meta({ description: "Item value determining rectangle size" }),
          color: z
            .string()
            .optional()
            .meta({ description: "Optional rectangle color" }),
        }),
      )
      .meta({ description: "Array of items with name and value" }),
    height: z
      .number()
      .default(300)
      .meta({ description: "Chart height in pixels" }),
  }),
});
