import z from "zod";
import { createComponentDefinition } from "uicast";

export const CollapsibleDef = createComponentDefinition({
  name: "Collapsible",
  description:
    "A simple expand/collapse block. Renders a trigger that toggles visibility of contained content. Use Collapsible for FAQ sections, expandable details, or any show/hide content pattern.",
  props: z.strictObject({
    open: z.boolean().default(false).meta({
      description: "Whether the collapsible is expanded",
    }),
    title: z.string().meta({
      description: "The trigger/header text",
    }),
  }),
  callbacks: {
    onOpenChange: z.strictObject({
      open: z.boolean().meta({ description: "The new open state" }),
    }),
  },
});
