import z from "zod";
import { createAIComponentDef } from "@ui-fired/core/render/create-ai-component-def";

export const MultiSelectDef = createAIComponentDef({
  name: "MultiSelect",
  description:
    "A multi-select dropdown for choosing multiple options from a list. Renders a trigger that opens a dropdown with checkboxes. Selected values are shown as tags in the trigger area. Use MultiSelect for filters, categories, permissions, or any field where multiple choices are needed.",
  props: z.strictObject({
    value: z.array(z.string()).default([]).meta({
      description: "Array of currently selected option values",
    }),
    options: z
      .array(
        z.object({
          label: z
            .string()
            .meta({ description: "Display text for this option" }),
          value: z.string().meta({ description: "The value for this option" }),
        }),
      )
      .meta({ description: "Array of available options" }),
    placeholder: z.string().optional().meta({
      description: "Placeholder text when no values are selected",
    }),
    disabled: z.boolean().default(false).meta({
      description: "Whether the multi-select is disabled",
    }),
  }),
  callbacks: {
    onChange: z.strictObject({
      value: z.array(z.string()).meta({
        description: "The updated array of selected values after toggling",
      }),
    }),
  },
});
