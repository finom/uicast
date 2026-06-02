import { ChunkComponent } from "@ui-fired/core/types";

export const countLines: ChunkComponent[] = [
  {
    key: "card1",
    component: "Card",
    props: { expr: '({ title: "Counter" })' },
    defaults: [{ set: "scopes.root.count", literal: 0 }],
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
      onClick: [{ set: "scopes.root.count", expr: "scopes.root.count + 1" }],
    },
  },
] as const;
