import z from "zod";
import { createComponentDefinition } from "@ui-fired/core";

export const AccordionItemDef = createComponentDefinition({
  name: "AccordionItem",
  description:
    "A single collapsible section inside an Accordion. Has a clickable trigger header that toggles the content visibility. The 'open' prop controls whether the content is visible. Children are the collapsible content.",
  props: z.strictObject({
    title: z.string().meta({
      description: "The header text shown on the trigger button",
    }),
    open: z.boolean().default(false).meta({
      description: "Whether this accordion item is currently expanded",
    }),
  }),
  callbacks: {
    onToggle: z
      .object({
        open: z.boolean().meta({
          description: "The new open state after toggling",
        }),
      })
      .meta({
        description: "Callback when the item is toggled open or closed",
      }),
  },
});
