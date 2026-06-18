import z from "zod";
import { createComponentDefinition } from "@ui-fired/core";

export const BannerDef = createComponentDefinition({
  name: "Banner",
  description:
    "A full-width banner notification for system-wide announcements or alerts. Renders a colored strip across the top or in-page. Use Banner for maintenance notices, feature announcements, promotions, or site-wide alerts.",
  props: z.strictObject({
    variant: z
      .enum(["info", "success", "warning", "error"])
      .default("info")
      .meta({
        description: "Banner color variant",
      }),
    dismissible: z.boolean().default(true).meta({
      description: "Whether the user can dismiss the banner",
    }),
    icon: z.string().optional().meta({
      description: "Optional Lucide icon name",
    }),
  }),
  callbacks: {
    onDismiss: z.strictObject({}).meta({
      description: "Callback when the banner is dismissed",
    }),
    onAction: z.strictObject({}).meta({
      description: "Callback when the action button is clicked",
    }),
  },
});
