import z from "zod";
import { createComponentDefinition } from "@uicast/core";
import { keyboardEventSchema } from "../../events/keyboard";

export const SearchInputDef = createComponentDefinition({
  name: "SearchInput",
  description:
    "A search input with a search icon and a clear button. It shows a spinner while the entry's `busy` is true. Use SearchInput for search bars, filter inputs, or any text search functionality.",
  props: z.strictObject({
    value: z.string().optional().meta({ description: "The current search text." }),
    placeholder: z.string().default("Search...").meta({
      description: "Placeholder text",
    }),
    disabled: z.boolean().default(false).meta({
      description: "Whether the input is disabled",
    }),
  }),
  callbacks: {
    onKeyDown: keyboardEventSchema,
    onKeyUp: keyboardEventSchema,
    onChange: z.strictObject({
      value: z.string().meta({ description: "The current search value" }),
    }),
    onClear: z.null().meta({
      description: "Callback when the clear button is clicked",
    }),
    onSubmit: z.strictObject({
      value: z.string().meta({ description: "The search value on submit" }),
    }),
  },
});
