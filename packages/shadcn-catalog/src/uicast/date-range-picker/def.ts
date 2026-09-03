import z from "zod";
import { createComponentDefinition } from "@uicast/core";

export const DateRangePickerDef = createComponentDefinition({
  name: "DateRangePicker",
  description:
    "A date range input for selecting a start and end date. Renders two native date inputs side by side. Use DateRangePicker for date range filters, booking periods, report date ranges, etc. Values are ISO date strings (YYYY-MM-DD).",
  props: z.strictObject({
    startDate: z.iso.date().optional().meta({ description: "First day of the range." }),
    endDate: z.iso.date().optional().meta({ description: "Last day of the range." }),
    min: z.iso.date().optional().meta({ description: "Earliest selectable date." }),
    max: z.iso.date().optional().meta({ description: "Latest selectable date." }),
    disabled: z.boolean().default(false).meta({
      description: "Whether the date range picker is disabled",
    }),
  }),
  callbacks: {
    onChange: z.strictObject({
      startDate: z.iso.date().meta({ description: "First day of the range." }),
      endDate: z.iso.date().meta({ description: "Last day of the range." }),
    }),
  },
});
