import z from "zod";
import { createAIComponentDef } from "@ui-fired/core/render/createAIComponentDef";

export const ConfirmDialogDef = createAIComponentDef({
  name: "ConfirmDialog",
  description:
    "A confirmation dialog that asks the user to confirm or cancel an action. Shows a title, description, and Confirm/Cancel buttons. Use ConfirmDialog for destructive actions like deleting items, or any action requiring user confirmation before proceeding.",
  props: z.strictObject({
    open: z
      .boolean()
      .default(false)
      .meta({ description: "Whether the dialog is open/visible" }),
    title: z
      .string()
      .default("Are you sure?")
      .meta({ description: "The confirmation dialog title" }),
    description: z
      .string()
      .optional()
      .meta({ description: "Explanatory text about what will happen" }),
    confirmLabel: z
      .string()
      .default("Confirm")
      .meta({ description: "Label for the confirm button" }),
    cancelLabel: z
      .string()
      .default("Cancel")
      .meta({ description: "Label for the cancel button" }),
    variant: z.enum(["default", "destructive"]).default("default").meta({
      description:
        "Button style for confirm: default (primary blue) or destructive (red, for dangerous actions)",
    }),
  }),
  callbacks: {
    onConfirm: z.object({}).meta({
      description: "Callback when the user clicks the confirm button",
    }),
    onCancel: z.object({}).meta({
      description: "Callback when the user clicks cancel or closes the dialog",
    }),
  },
});
