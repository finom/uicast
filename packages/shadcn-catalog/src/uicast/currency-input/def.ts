import z from "zod";
import { createComponentDefinition } from "@uicast/core";
import { keyboardEventSchema } from "../../events/keyboard";

export const CurrencyInputDef = createComponentDefinition({
  name: "CurrencyInput",
  description:
    "A formatted currency entry input. Displays amounts with currency symbol and formatting. Use CurrencyInput for financial forms, pricing inputs, payment amounts, etc.",
  props: z.object({
    value: z.number().optional().meta({
      description: "The numeric currency value",
    }),
    currency: z.string().default("USD").meta({
      description: "Currency code (e.g. USD, EUR, GBP)",
    }),
    locale: z.string().default("en-US").meta({
      description: "Locale for number formatting (e.g. en-US, de-DE)",
    }),
    placeholder: z.string().default("0.00").meta({
      description: "Placeholder text",
    }),
    disabled: z.boolean().default(false).meta({
      description: "Whether the input is disabled",
    }),
    min: z.number().optional().meta({
      description: "Minimum allowed value",
    }),
    max: z.number().optional().meta({
      description: "Maximum allowed value",
    }),
  }),
  callbacks: {
    onKeyDown: keyboardEventSchema,
    onKeyUp: keyboardEventSchema,
    onChange: z.object({
      value: z.number().meta({ description: "The new numeric value" }),
      formatted: z
        .string()
        .meta({ description: "The formatted currency string" }),
    }),
  },
});
