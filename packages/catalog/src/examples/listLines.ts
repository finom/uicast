import { ChunkComponent } from "ui-fired/core/types";

export const listLines: ChunkComponent[] = [
  {
    key: "list-card",
    op: "root",
    kind: "element",
    component: "Card",
    props: { literal: { title: "Dynamic List" } },
    children: ["list-items", "add-item-button"],
    defaults: [
      { set: "scopes.root.items", literal: ["Item 1", "Item 2", "Item 3"] },
    ],
  },
  {
    key: "list-items",
    op: "child",
    kind: "list",
    itemScope: "itemScope",
    component: "FlexRow",
    itemsSource: "scopes.root.items",
    props: { literal: { gap: "2" } },
    children: ["item-badge"],
  },
  {
    key: "item-badge",
    op: "child",
    kind: "element",
    component: "Badge",
    props: { expr: "({ children: scopes.itemScope.item })" },
  },
  {
    key: "add-item-button",
    op: "child",
    kind: "element",
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
