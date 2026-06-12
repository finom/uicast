import z from "zod";
import { createAIComponentDef } from "@ui-fired/core/render/create-ai-component-def";

export const RangeSliderDef = createAIComponentDef({
  name: "RangeSlider",
  description:
    "A dual-thumb slider for selecting a min/max range. Use RangeSlider for price range filters, date ranges, or any numeric range selection.",
  props: z.strictObject({
    min: z.number().default(0).meta({
      description: "The minimum possible value",
    }),
    max: z.number().default(100).meta({
      description: "The maximum possible value",
    }),
    step: z.number().default(1).meta({
      description: "Step increment",
    }),
    valueLow: z.number().default(25).meta({
      description: "The current low (left) value",
    }),
    valueHigh: z.number().default(75).meta({
      description: "The current high (right) value",
    }),
    disabled: z.boolean().default(false).meta({
      description: "Whether the slider is disabled",
    }),
    showValues: z.boolean().default(false).meta({
      description: "Whether to display the current range values",
    }),
  }),
  callbacks: {
    onChange: z.strictObject({
      valueLow: z.number().meta({ description: "The new low value" }),
      valueHigh: z.number().meta({ description: "The new high value" }),
    }),
  },
});
