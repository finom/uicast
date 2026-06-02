import z from "zod";
import { createAIComponentDef } from "@ui-fired/core/render/createAIComponentDef";
import { onClickSchema } from "@ui-fired/core/render/shared";

export const GridDef = createAIComponentDef({
  name: "Grid",
  description:
    "A CSS Grid container for arranging children in a responsive grid layout. Use Grid for card grids, image galleries, dashboard widgets, or any multi-column layout. Specify 'columns' for the number of columns, and children fill cells left-to-right, top-to-bottom.",
  props: z.strictObject({
    columns: z.enum(["1", "2", "3", "4", "5", "6"]).default("3").meta({
      description: "Number of grid columns (1-6)",
    }),
    gap: z.enum(["0", "1", "2", "3", "4", "6", "8"]).default("4").meta({
      description: "Gap between grid items using Tailwind spacing scale (0-8)",
    }),
  }),
  callbacks: {
    onClick: onClickSchema,
  },
});
