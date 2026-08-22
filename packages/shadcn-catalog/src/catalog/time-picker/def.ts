import z from "zod";
import { createComponentDefinition } from "@uicast/core";

export const TimePickerDef = createComponentDefinition({
  name: "TimePicker",
  description:
    "A time input field that uses the native HTML time picker. Renders an input[type=time]. Use TimePicker for selecting a time of day (appointment time, alarm time, schedule time, etc.). The value is a time string in HH:MM format (24-hour).",
  props: z.strictObject({
    value: z.string().optional().meta({
      description: "The selected time as HH:MM string (24-hour format)",
    }),
    min: z.string().optional().meta({
      description: "Minimum selectable time as HH:MM string",
    }),
    max: z.string().optional().meta({
      description: "Maximum selectable time as HH:MM string",
    }),
    disabled: z.boolean().default(false).meta({
      description: "Whether the time picker is disabled",
    }),
  }),
  callbacks: {
    onChange: z.strictObject({
      value: z.string().meta({
        description: "The newly selected time as HH:MM string",
      }),
    }),
  },
});
