import z from "zod";
import { createAIComponentDef } from "@ui-fired/core/render/create-ai-component-def";

export const ComboboxDef = createAIComponentDef({
  name: "Combobox",
  description:
    "An autocomplete + select hybrid component. Combines a text input with a dropdown list for search-and-select. Use Combobox for searchable dropdowns like country selectors, user pickers, or any list where users need to filter options by typing.",
  props: z.strictObject({
    value: z.string().optional().meta({
      description: "The currently selected value",
    }),
    placeholder: z.string().default("Select an option...").meta({
      description: "Placeholder text when no value is selected",
    }),
    searchPlaceholder: z.string().default("Search...").meta({
      description: "Placeholder text for the search input",
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
      .meta({ description: "Array of options to display" }),
    disabled: z.boolean().default(false).meta({
      description: "Whether the combobox is disabled",
    }),
    emptyMessage: z.string().default("No results found.").meta({
      description: "Message shown when no options match the search",
    }),
  }),
  callbacks: {
    onChange: z.strictObject({
      value: z.string().meta({ description: "The newly selected value" }),
      label: z
        .string()
        .meta({ description: "The label of the newly selected option" }),
    }),
  },
});
