import z from "zod";
import { createComponentDefinition } from "@uicast/core";

export const AccordionDef = createComponentDefinition({
  name: "Accordion",
  description:
    "A vertically stacked set of collapsible sections. Must contain AccordionItem children. Use Accordion for FAQ sections, settings panels, or any content that benefits from show/hide toggling. In 'single' type, only one item can be open at a time; in 'multiple' type, any number of items can be open simultaneously.",
  props: z.strictObject({
    type: z.enum(["single", "multiple"]).default("single").meta({
      description:
        "Whether only one item can be open at a time (single) or multiple items (multiple)",
    }),
    collapsible: z.boolean().default(true).meta({
      description:
        "Whether items can be fully collapsed (all closed). Only applies to 'single' type.",
    }),
  }),
});
