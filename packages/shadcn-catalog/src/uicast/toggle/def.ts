import z from "zod";
import { createComponentDefinition } from "@uicast/core";

export const ToggleDef = createComponentDefinition({
  name: "Toggle",
  description:
    "A single toggle button that can be pressed or unpressed. Use Toggle for bold/italic formatting buttons, show/hide toggles, or any binary state button.",
  props: z.strictObject({
    pressed: z.boolean().default(false).meta({
      description: "Whether the toggle is pressed/active",
    }),
    variant: z.enum(["default", "outline"]).default("default").meta({
      description: "Toggle visual variant",
    }),
    size: z.enum(["default", "sm", "lg"]).default("default").meta({
      description: "Toggle button size",
    }),
    disabled: z.boolean().default(false).meta({
      description: "Whether the toggle is disabled",
    }),
  }),
  callbacks: {
    onChange: z.strictObject({
      pressed: z.boolean().meta({ description: "The new pressed state" }),
    }),
  },
});
