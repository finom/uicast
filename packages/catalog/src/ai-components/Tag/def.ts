import z from "zod";
import { createAIComponentDef } from "@ui-fired/core/render/createAIComponentDef";
import { onClickSchema } from "@ui-fired/catalog/render/shared";

export const TagDef = createAIComponentDef({
  name: "Tag",
  description:
    "A removable tag/chip component for displaying labels, categories, or selected filters. Similar to Badge but with an optional close button. Use Tag for filter chips, selected multi-select values, or categorization labels that users can remove.",
  props: z.strictObject({
    children: z.any().optional().meta({ description: "The tag text content" }),
    variant: z
      .enum(["default", "secondary", "destructive", "outline"])
      .default("secondary")
      .meta({
        description:
          "Visual style variant: default (primary), secondary (muted), destructive (red), outline (bordered)",
      }),
    removable: z.boolean().default(false).meta({
      description: "Whether to show a close/remove button on the tag",
    }),
  }),
  callbacks: {
    onClick: onClickSchema,
    onRemove: z
      .object({})
      .meta({ description: "Callback when the remove button is clicked" }),
  },
});
