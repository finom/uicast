import z from "zod";
import { createComponentDefinition } from "@uicast/core";

export const NotificationBadgeDef = createComponentDefinition({
  name: "NotificationBadge",
  description:
    "A notification count badge that overlays on content. Renders a small colored dot or count badge. Use NotificationBadge wrapping icons, buttons, or avatars to show unread counts, alerts, or attention indicators.",
  props: z.strictObject({
    count: z.number().int().nonnegative().default(0).meta({
      description:
        "Notification count. 0 hides the badge unless showZero is true",
    }),
    max: z.number().int().min(1).default(99).meta({
      description: "Maximum displayed count (shows max+ for larger values)",
    }),
    variant: z
      .enum(["default", "destructive", "secondary"])
      .default("destructive")
      .meta({
        description: "Badge color variant",
      }),
    dot: z.boolean().default(false).meta({
      description: "Show as a small dot instead of count",
    }),
    showZero: z.boolean().default(false).meta({
      description: "Whether to show badge when count is 0",
    }),
  }),
});
