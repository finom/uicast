import z from "zod";
import { createComponentDefinition } from "@uicast/core";
import { mouseEventSchema } from "../../events/mouse";
import { iconNameSchema } from "../../lib/icons";

export const EmptyStateDef = createComponentDefinition({
  name: "EmptyState",
  description:
    "A placeholder component shown when there is no data to display. Shows an icon, a title, and an optional description. Use EmptyState inside tables, lists, or dashboards when there are zero results or no items yet. Child entries, such as a button to add an item, show below the text.",
  props: z.strictObject({
    title: z.string().default("No data").meta({
      description: "The primary empty state heading, e.g. 'No items found'",
    }),
    description: z.string().optional().meta({
      description: "Optional helper text, e.g. 'Try adjusting your filters'",
    }),
    icon: iconNameSchema.optional().meta({ description: "An icon in place of the default folder" }),
  }),
  callbacks: {
    onClick: mouseEventSchema,
  },
});
