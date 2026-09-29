import z from "zod";
import { createComponentDefinition } from "@uicast/core";
import { keyboardEventSchema } from "../../events/keyboard";

export const InputDef = createComponentDefinition({
  name: "Input",
  description:
    "A text input field for single-line text, email, password, or number entry. Renders a styled input element. Use Input for form fields.",
  props: z.strictObject({
    value: z.union([z.string(), z.number()]).optional().meta({ description: "The current input value." }),
    type: z
      .enum(["text", "email", "password", "number", "tel", "url", "search"])
      .default("text")
      .meta({ description: "The HTML input type" }),
    placeholder: z.string().optional().meta({ description: "Placeholder text shown when the input is empty" }),
    disabled: z.boolean().default(false).meta({ description: "Whether the input is disabled" }),
    required: z.boolean().default(false).meta({ description: "Whether it must be filled before its form submits" }),
  }),
  callbacks: {
    onKeyDown: keyboardEventSchema,
    onKeyUp: keyboardEventSchema,
    onChange: z.strictObject({
      value: z.string().meta({ description: "The current string value of the input" }),
      valueAsNumber: z.number().meta({
        description: "The current value as a number (0 if NaN)",
      }),
    }),
    onFocus: z.null(),
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
