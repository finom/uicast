import z from "zod";
import { createComponentDefinition } from "@uicast/core";

export const SortableListDef = createComponentDefinition({
  name: "SortableList",
  description:
    "An ordered list styled with drag-handle icons. Renders a static list of clickable items — the handles are visual only, items cannot be drag-reordered. Use SortableList to display task priorities, playlist order, preference rankings, or any ordered list.",
  props: z.object({
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
