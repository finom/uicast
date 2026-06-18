import z from "zod";
import { createComponentDefinition } from "@ui-fired/core";
import { mouseEventSchema } from "../../events/mouse";

export const FlexColDef = createComponentDefinition({
  name: "FlexCol",
  description:
    "A vertical flex container that lays out children in a column. Use FlexCol to stack components vertically with configurable gap and alignment. Common uses: form layouts, card content stacking, page sections.",
  props: z.strictObject({
    gap: z.enum(["0", "1", "2", "3", "4", "6", "8"]).default("2").meta({
      description: "Gap between children using Tailwind spacing scale (0-8)",
    }),
    align: z
      .enum(["start", "center", "end", "stretch"])
      .default("stretch")
      .meta({ description: "Horizontal alignment of children" }),
    justify: z
      .enum(["start", "center", "end", "between", "around", "evenly"])
      .default("start")
      .meta({ description: "Vertical distribution of children" }),
  }),
  callbacks: {
    onClick: mouseEventSchema,
  },
});
