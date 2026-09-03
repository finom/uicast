import z from "zod";
import { createComponentDefinition } from "@uicast/core";

export const RelativeTimeDef = createComponentDefinition({
  name: "RelativeTime",
  description:
    "A relative timestamp display ('3 hours ago', 'in 2 days'). Renders a date as a locale-aware relative time, past or future, computed once at render — it does not tick live. Use RelativeTime for activity feeds, comment timestamps, last updated displays, etc.",
  props: z.strictObject({
    date: z.iso.datetime({ offset: true }).meta({
      description: "The moment to describe, as an ISO date-time.",
    }),
    prefix: z.string().optional().meta({
      description: "Optional prefix text (e.g. 'Updated')",
    }),
  }),
});
