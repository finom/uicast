import z from "zod";
import { createComponentDefinition } from "@ui-fired/core/render/create-component-definition";

export const BadgeDef = createComponentDefinition({
  name: "Badge",
  description:
    "A small status indicator badge for displaying labels, counts, or tags. Renders as an inline pill-shaped element. Use Badge to show status (active, pending), categories, counts, or any short label that needs visual emphasis.",
  props: z.strictObject({
    children: z
      .any()
      .optional()
      .meta({ description: "The badge text content" }),
    variant: z
      .enum(["default", "secondary", "destructive", "outline"])
      .default("default")
      .meta({
        description:
          "Visual style: default (primary color), secondary (muted), destructive (red/danger), outline (bordered only)",
      }),
  }),
});
