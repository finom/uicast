import z from "zod";
import { createComponentDefinition } from "@ui-fired/core/def/create-component-definition";
import { onClickSchema } from "@ui-fired/catalog/render/shared";

export const StackDef = createComponentDefinition({
  name: "Stack",
  description:
    "A flex container that stacks children either vertically or horizontally with configurable spacing. Stack is a simpler alternative to FlexRow/FlexCol when you just need basic stacking with a gap. Use Stack for quick vertical or horizontal layouts.",
  props: z.strictObject({
    direction: z.enum(["vertical", "horizontal"]).default("vertical").meta({
      description: "Stack direction: vertical (column) or horizontal (row)",
    }),
    gap: z.enum(["0", "1", "2", "3", "4", "6", "8"]).default("2").meta({
      description: "Gap between children using Tailwind spacing scale (0-8)",
    }),
    align: z
      .enum(["start", "center", "end", "stretch"])
      .default("stretch")
      .meta({ description: "Cross-axis alignment of children" }),
  }),
  callbacks: {
    onClick: onClickSchema,
  },
});
