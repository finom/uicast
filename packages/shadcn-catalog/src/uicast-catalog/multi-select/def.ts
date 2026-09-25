import z from "zod";
import { createComponentDefinition } from "@uicast/core";

export const MultiSelectDef = createComponentDefinition({
  name: "MultiSelect",
  description:
    "A multi-select dropdown for choosing several options from a list. The trigger shows the selected options as tags, each with a remove icon, and opens a list where a click on an option toggles it; a check marks each selected option. Use MultiSelect for filters, categories, permissions, or any field where multiple choices are needed.",
  props: z.strictObject({
    value: z.array(z.string()).default([]).meta({
      description: "Array of currently selected option values",
    }),
    options: z
      .array(
        z.strictObject({
          label: z.string().meta({ description: "Display text for this option" }),
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
