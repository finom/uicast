import z from "zod";
import { createComponentDefinition } from "@uicast/core";
import { keyboardEventSchema } from "../../events/keyboard";
import { currencySchema, localeSchema } from "../../lib/locales";

export const CurrencyInputDef = createComponentDefinition({
  name: "CurrencyInput",
  description:
    "A currency entry input. Displays amounts with a currency symbol. Use CurrencyInput for financial forms, pricing inputs, payment amounts, etc.",
  props: z.strictObject({
    value: z.number().optional().meta({
      description: "The numeric currency value",
    }),
    currency: currencySchema.default("USD").meta({ description: "Which currency to format in." }),
    locale: localeSchema.default("en-US").meta({ description: "Which locale's number format to use." }),
    placeholder: z.string().default("0.00").meta({
      description: "Placeholder text",
    }),
    disabled: z.boolean().default(false).meta({
      description: "Whether the input is disabled",
    }),
    required: z.boolean().default(false).meta({
      description: "Whether an amount must be entered before its form submits",
    }),
  }),
  callbacks: {
    onKeyDown: keyboardEventSchema,
    onKeyUp: keyboardEventSchema,
    onChange: z.strictObject({
      value: z.number().meta({ description: "The new numeric value" }),
      formatted: z.string().meta({ description: "The formatted currency string" }),
    }),
  },
});
