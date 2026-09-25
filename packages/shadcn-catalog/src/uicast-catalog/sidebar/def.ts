import z from "zod";
import { createComponentDefinition } from "@uicast/core";
import { iconNameSchema } from "../../lib/icons";

export const SidebarDef = createComponentDefinition({
  name: "Sidebar",
  description:
    "A primary app navigation shell that collapses to icons. Renders a vertical sidebar with grouped navigation items. Use Sidebar for main app navigation with sections like Dashboard, Settings, Users, etc. Each section can have a title and a list of navigation items with icons and labels.",
  props: z.strictObject({
    sections: z
      .array(
        z.strictObject({
          title: z.string().optional().meta({
            description: "Optional section header title",
          }),
          items: z
            .array(
              z.strictObject({
                label: z.string().meta({ description: "Navigation item label" }),
                icon: iconNameSchema.optional().meta({
                  description: "Optional icon for the item.",
                }),
                active: z.boolean().optional().meta({
                  description: "Whether this item is currently active",
                }),
                badge: z.string().optional().meta({
                  description: "Optional badge text (e.g. count)",
                }),
              }),
            )
            .meta({ description: "Array of navigation items in this section" }),
        }),
      )
      .meta({ description: "Array of navigation sections" }),
    collapsed: z.boolean().default(false).meta({
      description: "Whether the sidebar is collapsed to icon-only mode",
    }),
    width: z.number().int().positive().default(256).meta({
      description: "Width in pixels when expanded.",
    }),
  }),
  callbacks: {
    onNavigate: z
      .strictObject({
        sectionIndex: z.number().int().nonnegative().meta({
          description: "The zero-based index of the section",
        }),
        itemIndex: z.number().int().nonnegative().meta({
          description: "The zero-based index of the item within the section",
        }),
        label: z.string().meta({
          description: "The label of the clicked navigation item",
        }),
      })
      .meta({ description: "Callback when a navigation item is clicked" }),
    onToggleCollapse: z
      .strictObject({
        collapsed: z.boolean().meta({
          description: "The new collapsed state",
        }),
      })
      .meta({
        description: "Callback when the sidebar collapse state toggles",
      }),
  },
});
