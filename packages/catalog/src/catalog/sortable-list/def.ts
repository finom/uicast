import z from "zod";
import { createComponentDefinition } from "@ui-fired/core/def/create-component-definition";

export const SortableListDef = createComponentDefinition({
  name: "SortableList",
  description:
    "An ordered list with drag handle indicators. Renders a list of items with reorder handles. Use SortableList for task prioritization, playlist ordering, preference ranking, or any user-reorderable list.",
  props: z.strictObject({
    items: z
      .array(
        z.object({
          id: z.string().meta({ description: "Item unique identifier" }),
          label: z.string().meta({ description: "Item display text" }),
          icon: z
            .string()
            .optional()
            .meta({ description: "Optional Lucide icon name" }),
        }),
      )
      .meta({ description: "Array of list items in order" }),
    showIndex: z.boolean().default(true).meta({
      description: "Whether to show position numbers",
    }),
  }),
  callbacks: {
    onItemClick: z
      .object({
        id: z.string().meta({ description: "Clicked item ID" }),
        index: z.number().meta({ description: "Item index" }),
      })
      .meta({ description: "Callback when an item is clicked" }),
  },
});
