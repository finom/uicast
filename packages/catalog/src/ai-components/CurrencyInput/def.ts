import z from "zod";
import { createAIComponentDef } from "@ui-fired/core/render/createAIComponentDef";

export const CurrencyInputDef = createAIComponentDef({
  name: "CurrencyInput",
  description:
    "A formatted currency entry input. Displays amounts with currency symbol and formatting. Use CurrencyInput for financial forms, pricing inputs, payment amounts, etc.",
  props: z.strictObject({
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
    onChange: z.strictObject({
      value: z.number().meta({ description: "The new numeric value" }),
      formatted: z
        .string()
        .meta({ description: "The formatted currency string" }),
    }),
  },
});
