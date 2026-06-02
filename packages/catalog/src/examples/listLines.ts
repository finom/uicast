import { ChunkComponent } from "@ui-fired/core/types";

export const listLines: ChunkComponent[] = [
  {
    key: "list-card",
    component: "Card",
    props: { literal: { title: "Dynamic List" } },
    children: ["list-items", "add-item-button"],
    defaults: [
      { set: "scopes.root.items", literal: ["Item 1", "Item 2", "Item 3"] },
    ],
  },
  {
    key: "list-items",
    as: "row",
    component: "FlexRow",
    each: "scopes.root.items",
    props: { literal: { gap: "2" } },
    children: ["item-badge"],
  },
  {
    key: "item-badge",
    component: "Badge",
    props: { expr: "({ children: scopes.row.item })" },
  },
  {
    key: "add-item-button",
    component: "Button",
    props: { literal: { children: "Add Item", variant: "outline" } },
    callbacks: {
      onClick: [
        {
          set: "scopes.root.items",
          expr: '[...scopes.root.items, "Item " + (scopes.root.items.length + 1)]',
        },
      ],
    },
  },
] as const;
