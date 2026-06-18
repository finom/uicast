import z from "zod";
import { createComponentDefinition } from "@ui-fired/core";
import { keyboardEventSchema } from "../../events/keyboard";

export const TagInputDef = createComponentDefinition({
  name: "TagInput",
  description:
    "A type-to-add tags/tokens input. Renders an input field with tag chips that can be added and removed. Use TagInput for tagging content, adding skills, entering email addresses, etc.",
  props: z.strictObject({
    tags: z.array(z.string()).default([]).meta({
      description: "Array of current tag strings",
    }),
    placeholder: z.string().default("Add a tag...").meta({
      description: "Placeholder text for the input",
    }),
    disabled: z.boolean().default(false).meta({
      description: "Whether the input is disabled",
    }),
    maxTags: z.number().optional().meta({
      description: "Maximum number of tags allowed",
    }),
  }),
  callbacks: {
    onKeyDown: keyboardEventSchema,
    onKeyUp: keyboardEventSchema,
    onAdd: z.strictObject({
      tag: z.string().meta({ description: "The tag that was added" }),
      tags: z
        .array(z.string())
        .meta({ description: "The updated array of all tags" }),
    }),
    onRemove: z.strictObject({
      tag: z.string().meta({ description: "The tag that was removed" }),
      index: z.number().meta({ description: "The index of the removed tag" }),
      tags: z
        .array(z.string())
        .meta({ description: "The updated array of remaining tags" }),
    }),
  },
});
