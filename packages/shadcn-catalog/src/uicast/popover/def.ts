import z from "zod";
import { createComponentDefinition } from "@uicast/core";

export const PopoverDef = createComponentDefinition({
  name: "Popover",
  description:
    "A floating popover panel that appears next to a trigger element. Controlled by the 'open' prop. Can contain any children content (forms, lists, details). Use Popover for inline editing, contextual information, mini-forms, or any content that should appear floating near a trigger. The trigger is the first child, and the popover content includes all remaining children.",
  props: z.object({
    open: z.boolean().default(false).meta({
      description: "Whether the popover is open/visible",
    }),
    triggerLabel: z.string().optional().meta({
      description:
        "Label text for a default trigger button. If omitted, renders a 'More' button.",
    }),
    side: z.enum(["top", "bottom", "left", "right"]).default("bottom").meta({
      description:
        "Preferred side to position the popover relative to the trigger",
    }),
  }),
  callbacks: {
    onOpenChange: z
      .object({
        open: z.boolean().meta({
          description: "The new open state",
        }),
      })
      .meta({
        description: "Callback when the popover open state changes",
      }),
  },
});
