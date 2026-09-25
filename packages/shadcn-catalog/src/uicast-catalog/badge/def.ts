import z from "zod";
import { createComponentDefinition } from "@uicast/core";

export const BadgeDef = createComponentDefinition({
  name: "Badge",
  description:
    "A small status indicator badge for displaying labels, counts, or tags. Renders as an inline pill-shaped element. Use Badge to show status (active, pending), categories, counts, or any short label that needs visual emphasis.",
  props: z.strictObject({
    text: z.union([z.string(), z.number()]).optional().meta({ description: "The badge text content" }),
    variant: z.enum(["default", "secondary", "destructive", "outline"]).default("default").meta({
      description:
        "Visual style: default (primary color), secondary (muted), destructive (red/danger), outline (bordered only)",
    }),
  }),
});
