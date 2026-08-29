import z from "zod";
import { createComponentDefinition } from "@uicast/core";

export const CalendarDef = createComponentDefinition({
  name: "Calendar",
  description:
    "A month-grid calendar with selectable dates and built-in month navigation. Use Calendar for date selection, event calendars, or scheduling interfaces.",
  props: z.object({
    selected: z.string().optional().meta({
      description: "The selected date as ISO string (YYYY-MM-DD)",
    }),
    disabled: z.boolean().default(false).meta({
      description: "Whether the calendar is disabled",
    }),
  }),
  callbacks: {
    onSelect: z.object({
      date: z
        .string()
        .meta({ description: "The selected date as ISO string (YYYY-MM-DD)" }),
    }),
  },
});
