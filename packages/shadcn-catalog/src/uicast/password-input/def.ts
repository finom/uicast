import z from "zod";
import { createComponentDefinition } from "@uicast/core";
import { keyboardEventSchema } from "../../events/keyboard";

export const PasswordInputDef = createComponentDefinition({
  name: "PasswordInput",
  description:
    "A password input with a show/hide toggle button. Renders a text input with masked characters and an eye icon to toggle visibility. Use PasswordInput for login forms, registration, or any password entry field.",
  props: z.object({
    value: z.any().meta({ description: "The current password value" }),
    placeholder: z.string().default("Enter password").meta({
      description: "Placeholder text",
    }),
    disabled: z.boolean().default(false).meta({
      description: "Whether the input is disabled",
    }),
  }),
  callbacks: {
    onKeyDown: keyboardEventSchema,
    onKeyUp: keyboardEventSchema,
    onChange: z.object({
      value: z.string().meta({ description: "The current password value" }),
    }),
    onFocus: z.null(),
    onBlur: z.object({
      value: z.string().meta({ description: "The password value on blur" }),
    }),
  },
});
