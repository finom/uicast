import type { ComponentEntry } from "@ui-fired/core";

export const countLines: ComponentEntry[] = [
  {
    key: "card1",
    component: "Card",
    props: { expr: '({ title: "Counter" })' },
    seed: [{ set: "scopes.root.count", literal: 0 }],
    children: ["count-text", "count-btn"],
  },
  {
    key: "count-text",
    component: "Text",
    props: {
      expr: '({ children: scopes.root.count, variant: "large" })',
    },
  },
  {
    key: "count-btn",
    component: "Button",
    props: { literal: { children: "Increment" } },
    callbacks: {
      onClick: [{ set: "scopes.root.count", expr: "currentValue + 1" }],
    },
  },
] as const;
