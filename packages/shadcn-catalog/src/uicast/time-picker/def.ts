import z from "zod";
import { createComponentDefinition } from "@uicast/core";

export const TimePickerDef = createComponentDefinition({
  name: "TimePicker",
  description:
    "A time input field that uses the native HTML time picker. Renders an input[type=time]. Use TimePicker for selecting a time of day (appointment time, alarm time, schedule time, etc.). The value is a time string in HH:MM format (24-hour).",
  props: z.strictObject({
    value: z.iso.time({ precision: -1 }).optional().meta({ description: "The selected time, 24-hour." }),
    min: z.iso.time({ precision: -1 }).optional().meta({ description: "Earliest selectable time." }),
    max: z.iso.time({ precision: -1 }).optional().meta({ description: "Latest selectable time." }),
    disabled: z.boolean().default(false).meta({
      description: "Whether the time picker is disabled",
    }),
  }),
  callbacks: {
    onChange: z.strictObject({
      value: z.iso.time({ precision: -1 }).meta({ description: "The newly selected time." }),
    }),
  },
});
