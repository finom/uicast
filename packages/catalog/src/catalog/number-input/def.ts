import z from "zod";
import { createComponentDefinition } from "@ui-fired/core/render/create-component-definition";

export const NumberInputDef = createComponentDefinition({
  name: "NumberInput",
  description:
    "A numeric input field specifically designed for entering numbers. Renders an HTML number input. Use NumberInput for quantities, amounts, scores, or any numeric-only data. For general text input, use Input instead.",
  props: z.strictObject({
    value: z.number().meta({ description: "The current numeric value" }),
    min: z.number().optional().meta({ description: "Minimum allowed value" }),
    max: z.number().optional().meta({ description: "Maximum allowed value" }),
    step: z
      .number()
      .optional()
      .meta({ description: "Step increment for up/down arrows" }),
    disabled: z
      .boolean()
      .default(false)
      .meta({ description: "Whether the input is disabled" }),
    placeholder: z
      .string()
      .optional()
      .meta({ description: "Placeholder text when empty" }),
  }),
  callbacks: {
    onChange: z.strictObject({
      value: z
        .number()
        .meta({ description: "The new numeric value (0 if NaN)" }),
    }),
  },
});
