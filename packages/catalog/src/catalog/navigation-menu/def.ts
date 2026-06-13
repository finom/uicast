import z from "zod";
import { createComponentDefinition } from "@ui-fired/core/render/create-component-definition";

export const NavigationMenuDef = createComponentDefinition({
  name: "NavigationMenu",
  description:
    "A structured multi-level navigation menu. Renders a horizontal navigation bar with dropdown sub-menus. Use NavigationMenu for top-level app navigation with grouped links (Products, Resources, Company, etc.).",
  props: z.strictObject({
    items: z
      .array(
        z.object({
          label: z.string().meta({ description: "Top-level menu item label" }),
          children: z
            .array(
              z.object({
                label: z.string().meta({ description: "Sub-item label" }),
                description: z.string().optional().meta({
                  description: "Optional sub-item description",
                }),
              }),
            )
            .optional()
            .meta({
              description:
                "Optional array of sub-menu items. If omitted, the item is a direct link.",
            }),
        }),
      )
      .meta({ description: "Array of top-level navigation items" }),
  }),
  callbacks: {
    onNavigate: z
      .object({
        label: z.string().meta({
          description: "The label of the clicked item",
        }),
        parentLabel: z.string().optional().meta({
          description:
            "The label of the parent menu item, if it was a sub-item",
        }),
      })
      .meta({ description: "Callback when a navigation item is clicked" }),
  },
});
