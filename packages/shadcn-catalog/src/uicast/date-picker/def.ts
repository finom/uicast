import z from "zod";
import { createComponentDefinition } from "@uicast/core";

export const DatePickerDef = createComponentDefinition({
  name: "DatePicker",
  description:
    "A date input field that uses the native HTML date picker. Renders an input[type=date]. Use DatePicker for selecting a single date (birthdate, due date, start date, etc.). The value is an ISO date string (YYYY-MM-DD).",
  props: z.object({
    value: z
      .string()
      .optional()
      .meta({ description: "The selected date as ISO string (YYYY-MM-DD)" }),
    min: z.string().optional().meta({
      description: "Minimum selectable date as ISO string (YYYY-MM-DD)",
    }),
    max: z.string().optional().meta({
      description: "Maximum selectable date as ISO string (YYYY-MM-DD)",
    }),
    disabled: z
      .boolean()
      .default(false)
      .meta({ description: "Whether the date picker is disabled" }),
  }),
  callbacks: {
    onChange: z.object({
      value: z.string().meta({
        description: "The newly selected date as ISO string (YYYY-MM-DD)",
      }),
    }),
  },
});
