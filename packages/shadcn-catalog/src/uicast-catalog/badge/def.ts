import z from "zod";
import { createComponentDefinition } from "@uicast/core";
import { mouseEventSchema } from "../../events/mouse";

export const BadgeDef = createComponentDefinition({
  name: "Badge",
  description:
    "A small pill-shaped label for status (active, pending), categories, counts, or tags. With `removable`, it shows a close button: filter chips, selected values, labels the user can remove.",
  props: z.strictObject({
    text: z.union([z.string(), z.number()]).optional().meta({ description: "The badge text content" }),
    variant: z.enum(["default", "secondary", "destructive", "outline"]).default("default").meta({
      description:
        "Visual style: default (primary color), secondary (muted), destructive (red/danger), outline (bordered only)",
    }),
    removable: z.boolean().default(false).meta({ description: "Whether to show a close button" }),
  }),
  callbacks: {
    onClick: mouseEventSchema,
    onRemove: z.null().meta({ description: "Callback when the close button is clicked" }),
  },
});
