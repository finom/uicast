import z from "zod";
import { createComponentDefinition } from "@ui-fired/core/def/create-component-definition";

export const CountdownTimerDef = createComponentDefinition({
  name: "CountdownTimer",
  description:
    "A countdown timer display showing remaining time. Renders a formatted countdown. Use CountdownTimer for sale end times, session expiry, event countdowns, or any time-limited display.",
  props: z.strictObject({
    targetDate: z.string().meta({
      description: "Target date/time as ISO string to count down to",
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
    onComplete: z.strictObject({}).meta({
      description: "Callback when countdown reaches zero",
    }),
  },
});
