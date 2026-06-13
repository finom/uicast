import z from "zod";
import { createComponentDefinition } from "@ui-fired/core/render/create-component-definition";

export const DateRangePickerDef = createComponentDefinition({
  name: "DateRangePicker",
  description:
    "A date range input for selecting a start and end date. Renders two native date inputs side by side. Use DateRangePicker for date range filters, booking periods, report date ranges, etc. Values are ISO date strings (YYYY-MM-DD).",
  props: z.strictObject({
    startDate: z.string().optional().meta({
      description: "The selected start date as ISO string (YYYY-MM-DD)",
    }),
    endDate: z.string().optional().meta({
      description: "The selected end date as ISO string (YYYY-MM-DD)",
    }),
    min: z.string().optional().meta({
      description: "Minimum selectable date as ISO string (YYYY-MM-DD)",
    }),
    max: z.string().optional().meta({
      description: "Maximum selectable date as ISO string (YYYY-MM-DD)",
    }),
    disabled: z.boolean().default(false).meta({
      description: "Whether the date range picker is disabled",
    }),
  }),
  callbacks: {
    onChange: z.strictObject({
      startDate: z.string().meta({
        description: "The selected start date as ISO string",
      }),
      endDate: z.string().meta({
        description: "The selected end date as ISO string",
      }),
    }),
  },
});
