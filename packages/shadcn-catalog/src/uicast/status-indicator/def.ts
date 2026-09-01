import z from "zod";
import { createComponentDefinition } from "@uicast/core";

export const StatusIndicatorDef = createComponentDefinition({
  name: "StatusIndicator",
  description:
    "A colored dot/badge for online, active, error states. Renders a small status dot with optional label. Use StatusIndicator for user online status, service health, order status, etc.",
  props: z.strictObject({
    status: z
      .enum([
        "online",
        "offline",
        "away",
        "busy",
        "error",
        "warning",
        "success",
        "default",
      ])
      .default("default")
      .meta({
        description: "The status type that determines the color",
      }),
    label: z.string().optional().meta({
      description: "Optional label text next to the indicator",
    }),
    pulse: z.boolean().default(false).meta({
      description: "Whether to show a pulsing animation",
    }),
    size: z.enum(["sm", "default", "lg"]).default("default").meta({
      description: "Dot size",
    }),
  }),
});
