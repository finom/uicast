import z from "zod";
import { createComponentDefinition } from "@uicast/core";
import { keyNameSchema } from "../../lib/keys";

export const MenubarDef = createComponentDefinition({
  name: "Menubar",
  description:
    "A top-level app menu bar (File, Edit, View, etc.). Renders a horizontal bar with dropdown menus. Use Menubar for desktop-style application menus with grouped actions.",
  props: z.strictObject({
    menus: z
      .array(
        z.strictObject({
          label: z
            .string()
            .meta({ description: "Menu trigger label (e.g. File, Edit)" }),
          items: z
            .array(
              z.strictObject({
                label: z.string().meta({ description: "Menu item label" }),
                shortcut: z.array(keyNameSchema).optional().meta({
                  description: "The shortcut's keys, in order.",
                }),
                disabled: z.boolean().optional().meta({
                  description: "Whether the item is disabled",
                }),
                separator: z.boolean().optional().meta({
                  description: "Whether to render a separator before this item",
                }),
              }),
            )
            .meta({ description: "Array of menu items" }),
        }),
      )
      .meta({ description: "Array of top-level menu definitions" }),
  }),
  callbacks: {
    onAction: z
      .strictObject({
        menuLabel: z.string().meta({
          description: "The label of the parent menu",
        }),
        itemLabel: z.string().meta({
          description: "The label of the clicked menu item",
        }),
      })
      .meta({ description: "Callback when a menu item is clicked" }),
  },
});
