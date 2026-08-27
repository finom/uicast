import z from "zod";
import { createComponentDefinition } from "@uicast/core";

export const CardDef = createComponentDefinition({
  name: "Card",
  description: "A bordered container.",
  props: z.strictObject({}),
});

export const HeadingDef = createComponentDefinition({
  name: "Heading",
  description: "A section heading.",
  props: z.strictObject({
    children: z.string().meta({ description: "The heading text" }),
  }),
});

export const ButtonDef = createComponentDefinition({
  name: "Button",
  description: "A click target.",
  props: z.strictObject({
    label: z.string().meta({ description: "Button text" }),
  }),
  callbacks: {
    onClick: z.null().meta({ description: "Fires when pressed" }),
  },
});

export const OrderRowDef = createComponentDefinition({
  name: "OrderRow",
  description: "One order: who placed it and what it came to.",
  props: z.strictObject({
    customer: z.string().meta({ description: "Who placed the order" }),
    total: z.number().meta({ description: "Order total, in dollars" }),
  }),
});
