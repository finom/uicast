import z from "zod";
import { createAIComponentDef } from "@ui-fired/core/render/create-ai-component-def";

export const CommandMenuDef = createAIComponentDef({
  name: "CommandMenu",
  description:
    "A ⌘K command palette for search, jump-to, and actions. Renders a dialog with a search input and grouped command items. Use CommandMenu for global search, quick navigation, and action execution.",
  props: z.strictObject({
    open: z.boolean().default(false).meta({
      description: "Whether the command menu is open",
    }),
    placeholder: z.string().default("Type a command or search...").meta({
      description: "Placeholder text for the search input",
    }),
    groups: z
      .array(
        z.object({
          heading: z.string().optional().meta({
            description: "Group heading label",
          }),
          items: z
            .array(
              z.object({
                label: z.string().meta({ description: "Command item label" }),
                icon: z.string().optional().meta({
                  description: "Lucide icon name for the item",
                }),
                shortcut: z.string().optional().meta({
                  description: "Keyboard shortcut text",
                }),
              }),
            )
            .meta({ description: "Array of command items in this group" }),
        }),
      )
      .meta({ description: "Array of command groups" }),
  }),
  callbacks: {
    onSelect: z
      .object({
        label: z.string().meta({
          description: "The label of the selected command",
        }),
        groupHeading: z.string().optional().meta({
          description:
            "The heading of the group containing the selected command",
        }),
      })
      .meta({ description: "Callback when a command is selected" }),
    onOpenChange: z
      .object({
        open: z.boolean().meta({
          description: "The new open state",
        }),
      })
      .meta({
        description: "Callback when the command menu open state changes",
      }),
  },
});
