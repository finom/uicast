import z from "zod";
import { createComponentDefinition } from "@uicast/core";
import { iconNameSchema } from "../../lib/icons";

export const AlertDef = createComponentDefinition({
  name: "Alert",
  description:
    "A feedback alert for important messages. Shows a status icon, an optional title and description, and child entries below them. Use Alert for success messages, error notices, warnings, tips, or informational notes within content. With `dismissible`, the user can close it: announcements, maintenance notices.",
  props: z.strictObject({
    title: z.string().optional().meta({ description: "The alert heading text" }),
    description: z.string().optional().meta({
      description: "Longer text below the title",
    }),
    status: z.enum(["info", "success", "warning", "error"]).default("info").meta({
      description: "The alert type determining the icon and its color; error is also shown in red (destructive)",
    }),
    icon: iconNameSchema.optional().meta({ description: "An icon in place of the status icon" }),
    dismissible: z.boolean().default(false).meta({ description: "Whether the user can close the alert" }),
  }),
  callbacks: {
    onDismiss: z.null().meta({ description: "Callback when the alert is closed" }),
  },
});
