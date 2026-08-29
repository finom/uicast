import z from "zod";
import { createComponentDefinition } from "@uicast/core";

// card/def.ts
export const CardDef = createComponentDefinition({
  name: "Card",
  description: "A bordered container.",
});

// heading/def.ts
export const HeadingDef = createComponentDefinition({
  name: "Heading",
  description: "A section heading.",
  props: z.object({
    text: z.string().meta({ description: "The heading text" }),
  }),
});

// button/def.ts
export const ButtonDef = createComponentDefinition({
  name: "Button",
  description: "A click target.",
  props: z.object({
    label: z.string().meta({ description: "Button text" }),
  }),
  callbacks: {
    onClick: z.null().meta({ description: "Fires when pressed" }),
  },
});

// order-row/def.ts
export const OrderRowDef = createComponentDefinition({
  name: "OrderRow",
  description: "One order: who placed it and what it came to.",
  props: z.object({
    customer: z.string().meta({ description: "Who placed the order" }),
    total: z.number().meta({ description: "Order total, in dollars" }),
  }),
});
