import z from "zod";
import { createComponentDefinition } from "@uicast/core";

export const DatePickerDef = createComponentDefinition({
  name: "DatePicker",
  description:
    "A date input field that uses the native HTML date picker. Renders an input[type=date]. Use DatePicker for selecting a single date (birthdate, due date, start date, etc.). The value is an ISO date string (YYYY-MM-DD).",
  props: z.strictObject({
    value: z.iso.date().optional().meta({ description: "The selected date." }),
    min: z.iso.date().optional().meta({ description: "Earliest selectable date." }),
    max: z.iso.date().optional().meta({ description: "Latest selectable date." }),
    disabled: z
      .boolean()
      .default(false)
      .meta({ description: "Whether the date picker is disabled" }),
  }),
  callbacks: {
    onChange: z.strictObject({
      value: z.iso.date().meta({ description: "The newly selected date." }),
    }),
  },
});
