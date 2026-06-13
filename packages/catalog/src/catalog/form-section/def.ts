import z from "zod";
import { createComponentDefinition } from "@ui-fired/core/render/create-component-definition";

export const FormSectionDef = createComponentDefinition({
  name: "FormSection",
  description:
    "A visual grouping of related form fields (fieldset). Renders a section with a title, optional description, and contained children. Use FormSection to organize complex forms into logical groups like 'Personal Information', 'Address', 'Payment Details', etc.",
  props: z.strictObject({
    title: z.string().meta({
      description: "Section title text",
    }),
    description: z.string().optional().meta({
      description: "Optional description text below the title",
    }),
    collapsible: z.boolean().default(false).meta({
      description: "Whether the section can be collapsed",
    }),
    defaultCollapsed: z.boolean().default(false).meta({
      description: "Whether the section starts collapsed",
    }),
  }),
});
