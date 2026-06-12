import z from "zod";
import { createAIComponentDef } from "@ui-fired/core/render/create-ai-component-def";

export const RelativeTimeDef = createAIComponentDef({
  name: "RelativeTime",
  description:
    "An auto-updating relative timestamp display ('3 hours ago'). Renders a date as a human-readable relative time. Use RelativeTime for activity feeds, comment timestamps, last updated displays, etc.",
  props: z.strictObject({
    date: z.string().meta({
      description: "The date/time as ISO string or any Date-parsable string",
    }),
    prefix: z.string().optional().meta({
      description: "Optional prefix text (e.g. 'Updated')",
    }),
    suffix: z.string().default("ago").meta({
      description: "Suffix text (e.g. 'ago')",
    }),
  }),
});
