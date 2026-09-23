import z from "zod";
import { createComponentDefinition } from "@uicast/core";

export const TreemapChartDef = createComponentDefinition({
  name: "TreemapChart",
  description:
    "A treemap: one rectangle per item, not nested. Each rectangle's area is proportional to its value. Use TreemapChart for disk usage, portfolio allocation, organizational budgets, or any proportional breakdown.",
  props: z.strictObject({
    data: z
      .array(
        z.strictObject({
          name: z.string().meta({ description: "Item name" }),
          value: z
            .number()
            .meta({ description: "Item value determining rectangle size" }),
        }),
      )
      .meta({ description: "Array of items with name and value" }),
    height: z
      .number().int().positive()
      .default(300)
      .meta({ description: "Chart height in pixels" }),
  }),
});
