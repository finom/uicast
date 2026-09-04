import z from "zod";
import { createComponentDefinition } from "@uicast/core";
import { keyboardEventSchema } from "../../events/keyboard";
import { callingCodeSchema } from "../../lib/country-codes";

export const PhoneInputDef = createComponentDefinition({
  name: "PhoneInput",
  description:
    "A phone number input with country code picker. Renders a select for country code and an input for the phone number. Use PhoneInput for contact forms, user registration, or any phone number entry.",
  props: z.strictObject({
    value: z.string().optional().meta({
      description: "The full phone number value (e.g. +1 555-1234)",
    }),
    countryCode: callingCodeSchema.default("+1").meta({ description: "The selected calling code." }),
    placeholder: z.string().default("Phone number").meta({
      description: "Placeholder text for the number input",
    }),
    disabled: z.boolean().default(false).meta({
      description: "Whether the input is disabled",
    }),
    countryCodes: z
      .array(callingCodeSchema)
      .optional()
      .meta({
        description:
          "Available country codes. Defaults to common codes if not provided.",
      }),
  }),
  callbacks: {
    onKeyDown: keyboardEventSchema,
    onKeyUp: keyboardEventSchema,
    onChange: z.strictObject({
      value: z
        .string()
        .meta({ description: "The phone number without country code" }),
      countryCode: z
        .string()
        .meta({ description: "The selected country code" }),
      fullNumber: z
        .string()
        .meta({ description: "The full phone number with country code" }),
    }),
  },
});
