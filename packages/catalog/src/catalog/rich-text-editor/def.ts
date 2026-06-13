import z from "zod";
import { createComponentDefinition } from "@ui-fired/core/render/create-component-definition";

export const RichTextEditorDef = createComponentDefinition({
  name: "RichTextEditor",
  description:
    "A WYSIWYG block editor for rich text content. Renders a toolbar with formatting options and an editable content area. Use RichTextEditor for writing blog posts, descriptions, comments, or any text that needs formatting like bold, italic, lists, headings, etc.",
  props: z.strictObject({
    value: z.string().default("").meta({
      description: "The HTML content of the editor",
    }),
    placeholder: z.string().default("Start writing...").meta({
      description: "Placeholder text",
    }),
    disabled: z.boolean().default(false).meta({
      description: "Whether the editor is disabled",
    }),
    minHeight: z.string().default("200px").meta({
      description: "Minimum height of the editor area",
    }),
  }),
  callbacks: {
    onChange: z.strictObject({
      value: z.string().meta({ description: "The updated HTML content" }),
    }),
  },
});
