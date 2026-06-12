import z from "zod";
import { createAIComponentDef } from "@ui-fired/core/render/create-ai-component-def";

export const AlertDialogDef = createAIComponentDef({
  name: "AlertDialog",
  description:
    "An alert dialog that requires user acknowledgment. Unlike ConfirmDialog which has confirm/cancel, AlertDialog shows a critical message with a single OK/acknowledge button. Use AlertDialog for error notifications, important warnings, or any message requiring user acknowledgment.",
  props: z.strictObject({
    open: z.boolean().default(false).meta({
      description: "Whether the dialog is open",
    }),
    title: z.string().meta({
      description: "Dialog title",
    }),
    description: z.string().optional().meta({
      description: "Dialog description text",
    }),
    actionLabel: z.string().default("OK").meta({
      description: "Label for the action button",
    }),
    variant: z.enum(["default", "destructive"]).default("default").meta({
      description: "Action button variant",
    }),
  }),
  callbacks: {
    onAction: z.strictObject({}).meta({
      description: "Callback when the action button is clicked",
    }),
  },
});
