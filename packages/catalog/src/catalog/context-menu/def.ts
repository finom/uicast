import z from "zod";
import { createComponentDefinition } from "@ui-fired/core/render/create-component-definition";

export const ContextMenuDef = createComponentDefinition({
  name: "ContextMenu",
  description:
    "A right-click context menu for rows, cards, or other elements. Wraps children and shows a context menu on right-click with action items. Use ContextMenu to provide contextual actions on table rows, cards, list items, etc.",
  props: z.strictObject({
    items: z
      .array(
        z.object({
          label: z.string().meta({ description: "Menu item label" }),
          shortcut: z.string().optional().meta({
            description: "Keyboard shortcut text",
          }),
          disabled: z.boolean().optional().meta({
            description: "Whether the item is disabled",
          }),
          separator: z.boolean().optional().meta({
            description: "Whether to render a separator before this item",
          }),
          variant: z.enum(["default", "destructive"]).optional().meta({
            description: "Visual variant for the item",
          }),
        }),
      )
      .meta({ description: "Array of context menu items" }),
  }),
  callbacks: {
    onAction: z
      .object({
        label: z.string().meta({
          description: "The label of the clicked menu item",
        }),
        index: z.number().meta({
          description: "The zero-based index of the clicked menu item",
        }),
      })
      .meta({ description: "Callback when a context menu item is clicked" }),
  },
});
