import z from "zod";
import { createComponentDefinition } from "@uicast/core";

export const SelectDef = createComponentDefinition({
  name: "Select",
  description:
    "A dropdown select component for choosing one option from a list. Renders a styled select trigger that opens a dropdown popover with options. Use Select for any single-choice selection (status, category, country, etc.). The 'options' prop is an array of objects with 'label' and 'value'. For multi-select, use multiple Tag components or checkboxes instead.",
  props: z.object({
    value: z
      .string()
      .optional()
      .meta({ description: "The currently selected value" }),
    placeholder: z
      .string()
      .optional()
      .meta({ description: "Placeholder text when no value is selected" }),
    options: z
      .array(
        z.object({
          label: z
            .string()
            .meta({ description: "Display text for this option" }),
          value: z.string().meta({ description: "The value for this option" }),
        }),
      )
      .meta({ description: "Array of options to display in the dropdown" }),
    disabled: z
      .boolean()
      .default(false)
      .meta({ description: "Whether the select is disabled" }),
  }),
  callbacks: {
    onChange: z.object({
      value: z.string().meta({ description: "The newly selected value" }),
    }),
  },
});
