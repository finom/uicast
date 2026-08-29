import z from "zod";
import { createComponentDefinition } from "@uicast/core";
import { keyboardEventSchema } from "../../events/keyboard";

export const MaskedInputDef = createComponentDefinition({
  name: "MaskedInput",
  description:
    "A pattern-enforced input for formatted data like SSN, card numbers, dates. Displays a mask pattern and auto-formats input. Use MaskedInput for credit card numbers, social security numbers, date entries, etc.",
  props: z.object({
    value: z.string().optional().meta({
      description: "The current input value",
    }),
    mask: z.string().default("###-##-####").meta({
      description:
        "The mask pattern where # represents a digit, A represents a letter, and * represents any character. Other characters are literal separators.",
    }),
    placeholder: z.string().optional().meta({
      description: "Placeholder text. Defaults to the mask pattern.",
    }),
    disabled: z.boolean().default(false).meta({
      description: "Whether the input is disabled",
    }),
  }),
  callbacks: {
    onKeyDown: keyboardEventSchema,
    onKeyUp: keyboardEventSchema,
    onChange: z.object({
      value: z
        .string()
        .meta({ description: "The formatted value with mask applied" }),
      rawValue: z
        .string()
        .meta({ description: "The raw value without mask characters" }),
    }),
  },
});
