import z from "zod";
import { createComponentDefinition } from "@uicast/core";

export const SliderDef = createComponentDefinition({
  name: "Slider",
  description:
    "A slider for selecting a numeric value within a range. Use Slider for volume controls, brightness settings, or any numeric value selection. With a [low, high] pair as `value`, it has two thumbs and selects a range: price filters, date ranges.",
  props: z.strictObject({
    value: z
      .union([z.number(), z.tuple([z.number(), z.number()])])
      .default(0)
      .meta({ description: "The current value, or a [low, high] pair for a range" }),
    min: z.number().default(0).meta({
      description: "Minimum value",
    }),
    max: z.number().default(100).meta({
      description: "Maximum value",
    }),
    step: z.number().default(1).meta({
      description: "Step increment",
    }),
    disabled: z.boolean().default(false).meta({
      description: "Whether the slider is disabled",
    }),
    showValue: z.boolean().default(false).meta({
      description: "Whether to display the current value, or both ends of a range",
    }),
  }),
  callbacks: {
    onChange: z.strictObject({
      value: z
        .union([z.number(), z.tuple([z.number(), z.number()])])
        .meta({ description: "The new value, a [low, high] pair for a range" }),
    }),
  },
});
