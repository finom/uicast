import z from "zod";
import { createComponentDefinition } from "uicast";
import { keyboardEventSchema } from "../../events/keyboard";

export const InputDef = createComponentDefinition({
  name: "Input",
  description:
    "A text input field for single-line text, email, password, or number entry. Renders a styled input element. Use Input for form fields. For labels and descriptions, wrap with Field, FieldLabel, and FieldDescription components. For a dedicated numeric stepper, see NumberInput.",
  props: z.strictObject({
    value: z.any().meta({ description: "The current input value" }),
    type: z
      .enum(["text", "email", "password", "number", "tel", "url", "search"])
      .default("text")
      .meta({ description: "The HTML input type" }),
    placeholder: z
      .string()
      .optional()
      .meta({ description: "Placeholder text shown when the input is empty" }),
    disabled: z
      .boolean()
      .default(false)
      .meta({ description: "Whether the input is disabled" }),
  }),
  callbacks: {
    onKeyDown: keyboardEventSchema,
    onKeyUp: keyboardEventSchema,
    onChange: z.strictObject({
      value: z
        .string()
        .meta({ description: "The current string value of the input" }),
      valueAsNumber: z.number().meta({
        description: "The current value as a number (0 if NaN)",
      }),
    }),
    onFocus: z.strictObject({}),
    onBlur: z.strictObject({
      value: z.string().meta({
        description: "The current string value of the input on blur",
      }),
      valueAsNumber: z.number().meta({
        description: "The current value as a number on blur (0 if NaN)",
      }),
    }),
  },
});
