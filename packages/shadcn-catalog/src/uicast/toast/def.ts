import z from "zod";
import { createComponentDefinition } from "@uicast/core";

export const ToastDef = createComponentDefinition({
  name: "Toast",
  description:
    "A toast notification banner for brief messages. Positioned at the edge of the viewport, with a close button that fires onClose — there is no auto-dismiss timer. Use Toast for success confirmations, error alerts, or informational messages. Control visibility with the 'open' prop.",
  props: z.strictObject({
    open: z.boolean().default(false).meta({
      description: "Whether the toast is currently visible",
    }),
    title: z.string().meta({
      description: "The toast message title",
    }),
    description: z.string().optional().meta({
      description: "Optional longer description text",
    }),
    variant: z
      .enum(["default", "success", "error", "warning"])
      .default("default")
      .meta({
        description:
          "Visual variant: default (neutral), success (green), error (red), warning (yellow)",
      }),
    position: z
      .enum(["top-right", "top-left", "bottom-right", "bottom-left"])
      .default("bottom-right")
      .meta({
        description: "Screen position for the toast notification",
      }),
  }),
  callbacks: {
    onClose: z.null().meta({
      description: "Callback when the toast is dismissed",
    }),
  },
});
