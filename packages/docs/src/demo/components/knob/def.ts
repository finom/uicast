import { createComponentDefinition } from "@uicast/core";
import z from "zod";

export const KnobDef = createComponentDefinition({
  name: "Knob",
  description: "A rotary knob. Drag up to increase, down to decrease. Emits the new value on every change.",
  props: z.strictObject({
    value: z.number().default(50).meta({ description: "The current value" }),
    min: z.number().default(0).meta({ description: "Minimum value" }),
    max: z.number().default(100).meta({ description: "Maximum value" }),
    label: z.string().optional().meta({ description: "Caption shown under the knob" }),
  }),
  callbacks: {
    onTurn: z.strictObject({
      value: z.number().meta({ description: "The new value, clamped to [min, max]" }),
    }),
  },
});
