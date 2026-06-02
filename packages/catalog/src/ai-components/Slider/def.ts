import z from "zod";
import { createAIComponentDef } from "@ui-fired/core/render/createAIComponentDef";

export const SliderDef = createAIComponentDef({
  name: "Slider",
  description:
    "A single-value slider for selecting a numeric value within a range. Use Slider for volume controls, brightness settings, price filters, or any single numeric value selection.",
  props: z.strictObject({
    value: z.number().default(0).meta({
      description: "The current slider value",
    }),
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
      description: "Whether to display the current value label",
    }),
  }),
  callbacks: {
    onChange: z.strictObject({
      value: z.number().meta({ description: "The new slider value" }),
    }),
  },
});
