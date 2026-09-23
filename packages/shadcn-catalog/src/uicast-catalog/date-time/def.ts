import z from "zod";
import { createComponentDefinition } from "@uicast/core";

// ECMAScript's Date range: milliseconds either side of 1970.
const MAX_TIME_VALUE = 8.64e15;

const numericOr2Digit = z.enum(["numeric", "2-digit"]);
const styles = z.enum(["full", "long", "medium", "short"]);

export const DateTimeDef = createComponentDefinition({
  name: "DateTime",
  description:
    "A date or a time in the viewer's language and time zone: 'Sep 23, 2026', '2:30 PM', '3 hours ago'. Renders a <time> element in the surrounding text style. Use DateTime wherever a document shows a date or a time: an expression cannot format one.",
  props: z.strictObject({
    value: z
      .union([
        z.iso.datetime({ offset: true }),
        z.iso.date(),
        z.number().int().min(-MAX_TIME_VALUE).max(MAX_TIME_VALUE),
      ])
      .meta({
        description:
          "The moment: an ISO date-time ('2026-09-23T14:30:00Z'), an ISO date ('2026-09-23', shown as that day in every time zone), or a timestamp in milliseconds, as Date.now() and Date.parse() give.",
      }),
    format: z
      .union([
        z.enum(["date", "time", "datetime", "relative"]),
        z.strictObject({
          weekday: z.enum(["narrow", "short", "long"]).optional(),
          year: numericOr2Digit.optional(),
          month: z.enum(["numeric", "2-digit", "narrow", "short", "long"]).optional(),
          day: numericOr2Digit.optional(),
          hour: numericOr2Digit.optional(),
          minute: numericOr2Digit.optional(),
          second: numericOr2Digit.optional(),
          hour12: z.boolean().optional(),
          dateStyle: styles.optional(),
          timeStyle: styles.optional(),
          timeZone: z.string().optional().meta({ description: "An IANA time zone, as 'UTC' or 'Europe/Berlin'. Default: the viewer's." }),
          timeZoneName: z.enum(["short", "long"]).optional(),
        }),
      ])
      .default("date")
      .meta({
        description:
          "'date' (Sep 23, 2026), 'time' (2:30 PM), 'datetime' (Sep 23, 2026, 2:30 PM), 'relative' (3 hours ago, in 2 days; updates as time passes), or Intl.DateTimeFormat options for any other shape: { month: 'long', year: 'numeric' } gives September 2026. A style (dateStyle, timeStyle) cannot be mixed with single fields.",
      }),
    prefix: z.string().optional().meta({ description: "Text before the date, as 'Updated'." }),
  }),
});
