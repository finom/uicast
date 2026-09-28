import z from "zod";
import { createComponentDefinition } from "@uicast/core";

export const SelectDef = createComponentDefinition({
  name: "Select",
  description:
    "A dropdown select component for choosing one option from a list. Renders a styled select trigger that opens a dropdown popover with options. Use Select for any single-choice selection (status, category, country, etc.). The 'options' prop is an array of objects with 'label' and 'value'. With `searchable`, the dropdown has a search field that filters the options by typing: long lists such as countries or users.",
  props: z.strictObject({
    value: z.string().optional().meta({ description: "The currently selected value" }),
    placeholder: z.string().optional().meta({ description: "Placeholder text when no value is selected" }),
    options: z
      .array(
        z.strictObject({
          label: z.string().meta({ description: "Display text for this option" }),
          value: z.string().meta({ description: "The value for this option" }),
        }),
      )
      .meta({ description: "Array of options to display in the dropdown" }),
    disabled: z.boolean().default(false).meta({ description: "Whether the select is disabled" }),
    searchable: z.boolean().default(false).meta({ description: "Whether the dropdown has a search field" }),
    searchPlaceholder: z.string().default("Search...").meta({
      description: "Placeholder text for the search field",
    }),
    emptyMessage: z.string().default("No results found.").meta({
      description: "Message shown when no options match the search",
    }),
  }),
  callbacks: {
    onChange: z.strictObject({
      value: z.string().meta({ description: "The newly selected value" }),
      label: z.string().meta({ description: "The label of the newly selected option" }),
    }),
  },
});
