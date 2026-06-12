import z from "zod";
import { createAIComponentDef } from "@ui-fired/core/render/create-ai-component-def";
import { onClickSchema } from "@ui-fired/catalog/render/shared";

export const EmptyStateDef = createAIComponentDef({
  name: "EmptyState",
  description:
    "A placeholder component shown when there is no data to display. Shows an icon, a title, and an optional description. Use EmptyState inside tables, lists, or dashboards when there are zero results or no items yet. Can contain children components such as a Button to add an item.",
  props: z.strictObject({
    title: z.string().default("No data").meta({
      description: "The primary empty state heading, e.g. 'No items found'",
    }),
    description: z.string().optional().meta({
      description: "Optional helper text, e.g. 'Try adjusting your filters'",
    }),
  }),
  callbacks: {
    onClick: onClickSchema,
  },
});
