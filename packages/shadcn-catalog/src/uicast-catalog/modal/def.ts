import z from "zod";
import { createComponentDefinition } from "@uicast/core";

export const ModalDef = createComponentDefinition({
  name: "Modal",
  description:
    "A modal dialog overlay that appears on top of the page content. Controlled by the 'open' prop. Contains a title, optional description, and any children components in the body. Use Modal for forms, detail views, confirmations, or any content that requires user focus. Use the 'hidden' entry property or the 'open' prop to control visibility. The onOpenChange callback fires when the user closes the modal (clicks overlay or X button).",
  props: z.strictObject({
    open: z
      .boolean()
      .default(false)
      .meta({ description: "Whether the modal is open/visible" }),
    title: z
      .string()
      .optional()
      .meta({ description: "The modal header title" }),
    description: z
      .string()
      .optional()
      .meta({ description: "Optional description text below the title" }),
  }),
  callbacks: {
    onOpenChange: z
      .strictObject({
        open: z.boolean().meta({
          description: "The new open state (typically false when closing)",
        }),
      })
      .meta({
        description:
          "Callback when the modal open state changes (e.g. user clicks close)",
      }),
  },
});
