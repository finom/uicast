import z from "zod";
import { createComponentDefinition } from "@ui-fired/core";

export const SearchInputDef = createComponentDefinition({
  name: "SearchInput",
  description:
    "A search input with a search icon, clear button, and optional loading state. Use SearchInput for search bars, filter inputs, or any text search functionality.",
  props: z.strictObject({
    value: z.any().meta({ description: "The current search value" }),
    placeholder: z.string().default("Search...").meta({
      description: "Placeholder text",
    }),
    disabled: z.boolean().default(false).meta({
      description: "Whether the input is disabled",
    }),
    loading: z.boolean().default(false).meta({
      description: "Whether to show a loading spinner",
    }),
  }),
  callbacks: {
    onChange: z.strictObject({
      value: z.string().meta({ description: "The current search value" }),
    }),
    onClear: z.strictObject({}).meta({
      description: "Callback when the clear button is clicked",
    }),
    onSubmit: z.strictObject({
      value: z.string().meta({ description: "The search value on submit" }),
    }),
  },
});
