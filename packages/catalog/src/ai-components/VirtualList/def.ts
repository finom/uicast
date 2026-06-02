import z from "zod";
import { createAIComponentDef } from "ui-fired/core/render/createAIComponentDef";

export const VirtualListDef = createAIComponentDef({
  name: "VirtualList",
  description:
    "A virtualized list for efficiently rendering large datasets. Only renders visible items for performance. Use VirtualList for large datasets like logs, contacts, search results, or any list with hundreds+ items.",
  props: z.strictObject({
    items: z
      .array(
        z.object({
          id: z.string().meta({ description: "Item unique identifier" }),
          primary: z.string().meta({ description: "Primary text" }),
          secondary: z
            .string()
            .optional()
            .meta({ description: "Secondary text" }),
        }),
      )
      .meta({ description: "Array of list items" }),
    height: z.number().default(400).meta({
      description: "Container height in pixels",
    }),
    itemHeight: z.number().default(48).meta({
      description: "Height of each item in pixels",
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
