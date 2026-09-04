import z from "zod";
import { createComponentDefinition } from "@uicast/core";

export const CountdownTimerDef = createComponentDefinition({
  name: "CountdownTimer",
  description:
    "A countdown timer display showing remaining time. Renders a formatted countdown. Use CountdownTimer for sale end times, session expiry, event countdowns, or any time-limited display.",
  props: z.strictObject({
    targetDate: z.iso.datetime({ offset: true }).meta({
      description: "The moment to count down to, as an ISO date-time.",
    }),
    showDays: z.boolean().default(true).meta({
      description: "Whether to show days component",
    }),
    showHours: z.boolean().default(true).meta({
      description: "Whether to show hours component",
    }),
    showMinutes: z.boolean().default(true).meta({
      description: "Whether to show minutes component",
    }),
    showSeconds: z.boolean().default(true).meta({
      description: "Whether to show seconds component",
    }),
    size: z.enum(["sm", "default", "lg"]).default("default").meta({
      description: "Timer display size",
    }),
  }),
  callbacks: {
    onComplete: z.null().meta({
      description: "Callback when countdown reaches zero",
    }),
  },
});
