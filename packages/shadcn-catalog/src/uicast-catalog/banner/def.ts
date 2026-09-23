import z from "zod";
import { createComponentDefinition } from "@uicast/core";
import { iconNameSchema } from "../../lib/icons";

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
    icon: iconNameSchema.optional().meta({
      description: "Optional icon shown before the message.",
    }),
  }),
  callbacks: {
    onDismiss: z.null().meta({
      description: "Callback when the banner is dismissed",
    }),
  },
});
