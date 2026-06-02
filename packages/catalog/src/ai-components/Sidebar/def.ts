import z from "zod";
import { createAIComponentDef } from "ui-fired/core/render/createAIComponentDef";

export const SidebarDef = createAIComponentDef({
  name: "Sidebar",
  description:
    "A primary app navigation shell with collapsible sections. Renders a vertical sidebar with grouped navigation items. Use Sidebar for main app navigation with sections like Dashboard, Settings, Users, etc. Each section can have a title and a list of navigation items with icons and labels.",
  props: z.strictObject({
    sections: z
      .array(
        z.object({
          title: z.string().optional().meta({
            description: "Optional section header title",
          }),
          items: z
            .array(
              z.object({
                label: z
                  .string()
                  .meta({ description: "Navigation item label" }),
                icon: z.string().optional().meta({
                  description: "Lucide icon name for the item",
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
    width: z.string().default("256px").meta({
      description: "Sidebar width when expanded, e.g. '256px'",
    }),
  }),
  callbacks: {
    onNavigate: z
      .object({
        sectionIndex: z.number().meta({
          description: "The zero-based index of the section",
        }),
        itemIndex: z.number().meta({
          description: "The zero-based index of the item within the section",
        }),
        label: z.string().meta({
          description: "The label of the clicked navigation item",
        }),
      })
      .meta({ description: "Callback when a navigation item is clicked" }),
    onToggleCollapse: z
      .object({
        collapsed: z.boolean().meta({
          description: "The new collapsed state",
        }),
      })
      .meta({
        description: "Callback when the sidebar collapse state toggles",
      }),
  },
});
