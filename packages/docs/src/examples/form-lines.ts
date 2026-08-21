import type { ComponentEntry } from "uicast";

export const formLines: ComponentEntry[] = [
  {
    key: "card2",
    component: "Card",
    props: { literal: { title: "Form Example" } },
    seed: [{ set: "scopes.root.count", literal: 0 }],
    children: ["field1"],
  },
  {
    key: "field1",
    component: "Field",
    children: ["field1-label", "input1", "field1-desc"],
  },
  {
    key: "field1-label",
    component: "FieldLabel",
    props: { literal: { children: "Count" } },
  },
  {
    key: "input1",
    component: "Input",
    props: {
      expr: '({ value: scopes.root.count, kind: "number" })',
    },
    callbacks: {
      onChange: [{ set: "scopes.root.count", expr: "evt.valueAsNumber" }],
    },
  },
  {
    key: "field1-desc",
    component: "FieldDescription",
    props: { literal: { children: "Enter a number value" } },
  },
] as const;
