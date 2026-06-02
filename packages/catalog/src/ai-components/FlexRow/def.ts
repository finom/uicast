import z from "zod";
import { createAIComponentDef } from "ui-fired/core/render/createAIComponentDef";
import { onClickSchema } from "ui-fired/core/render/shared";

export const FlexRowDef = createAIComponentDef({
  name: "FlexRow",
  description:
    "A horizontal flex container that lays out children in a row. Use FlexRow to arrange components side by side horizontally with configurable gap, alignment, and wrapping. Common uses: button groups, inline form fields, stat cards in a row, icon + text combos.",
  props: z.strictObject({
    gap: z.enum(["0", "1", "2", "3", "4", "6", "8"]).default("2").meta({
      description: "Gap between children using Tailwind spacing scale (0-8)",
    }),
    align: z
      .enum(["start", "center", "end", "stretch", "baseline"])
      .default("center")
      .meta({ description: "Vertical alignment of children" }),
    justify: z
      .enum(["start", "center", "end", "between", "around", "evenly"])
      .default("start")
      .meta({ description: "Horizontal distribution of children" }),
    wrap: z.boolean().default(false).meta({
      description:
        "Whether children wrap to the next line when there is no space",
    }),
    equalWidth: z.boolean().default(false).meta({
      description:
        "Whether all children should have equal width (flex: 1). Useful for side-by-side columns.",
    }),
  }),
  callbacks: {
    onClick: onClickSchema,
  },
});
