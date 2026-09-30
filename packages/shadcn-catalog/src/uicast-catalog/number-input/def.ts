import z from "zod";
import { createComponentDefinition } from "@uicast/core";
import { keyboardEventSchema } from "../../events/keyboard";

export const NumberInputDef = createComponentDefinition({
  name: "NumberInput",
  description:
    "A numeric input field specifically designed for entering numbers. Renders an HTML number input. Use NumberInput for quantities, amounts, scores, or any numeric-only data.",
  props: z.strictObject({
    value: z.number().optional().meta({ description: "The current numeric value. The field is empty without it." }),
    min: z.number().optional().meta({ description: "Minimum allowed value" }),
    max: z.number().optional().meta({ description: "Maximum allowed value" }),
    step: z.number().optional().meta({ description: "Step increment for up/down arrows" }),
    disabled: z.boolean().default(false).meta({ description: "Whether the input is disabled" }),
    required: z.boolean().default(false).meta({ description: "Whether it must be filled before its form submits" }),
    placeholder: z.string().optional().meta({ description: "Placeholder text when empty" }),
  }),
  callbacks: {
    onKeyDown: keyboardEventSchema,
    onKeyUp: keyboardEventSchema,
    onChange: z.strictObject({
      value: z
        .number()
        .optional()
        .meta({ description: "The new numeric value. Missing while the field holds no number." }),
    }),
  },
});
