import z from "zod";
import { createComponentDefinition } from "@uicast/core";

export const CounterDef = createComponentDefinition({
  name: "Counter",
  description:
    "A button that shows a number and increments it on each click.",
  props: z.object({
    count: z.number().default(0).meta({ description: "The number to display" }),
  }),
  callbacks: {
    onClick: z.null().meta({ description: "Fires when the counter is pressed" }),
  },
});
