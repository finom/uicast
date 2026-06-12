import z from "zod";
import { createAIComponentDef } from "@ui-fired/core/render/create-ai-component-def";

export const CalendarDef = createAIComponentDef({
  name: "Calendar",
  description:
    "A calendar display for month/week/day views. Renders a calendar grid with selectable dates. Use Calendar for date selection, event calendars, or scheduling interfaces.",
  props: z.strictObject({
    selected: z.string().optional().meta({
      description: "The selected date as ISO string (YYYY-MM-DD)",
    }),
    month: z.number().optional().meta({
      description: "The displayed month (1-12). Defaults to current month.",
    }),
    year: z.number().optional().meta({
      description: "The displayed year. Defaults to current year.",
    }),
    disabled: z.boolean().default(false).meta({
      description: "Whether the calendar is disabled",
    }),
  }),
  callbacks: {
    onSelect: z.strictObject({
      date: z
        .string()
        .meta({ description: "The selected date as ISO string (YYYY-MM-DD)" }),
    }),
    onMonthChange: z.strictObject({
      month: z.number().meta({ description: "The new month (1-12)" }),
      year: z.number().meta({ description: "The new year" }),
    }),
  },
});
