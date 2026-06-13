import z from "zod";
import { createComponentDefinition } from "@ui-fired/core/render/create-component-definition";

export const CodeEditorDef = createComponentDefinition({
  name: "CodeEditor",
  description:
    "A syntax-highlighted code input area. Renders a monospaced textarea with line numbers for code editing. Use CodeEditor for configuration input, code snippets, template editing, or any structured text entry.",
  props: z.strictObject({
    value: z.string().default("").meta({
      description: "The code content",
    }),
    language: z.string().default("javascript").meta({
      description:
        "The programming language for syntax context (e.g. javascript, python, json)",
    }),
    placeholder: z.string().default("Enter code...").meta({
      description: "Placeholder text",
    }),
    disabled: z.boolean().default(false).meta({
      description: "Whether the editor is disabled",
    }),
    minHeight: z.string().default("200px").meta({
      description: "Minimum height of the editor",
    }),
    showLineNumbers: z.boolean().default(true).meta({
      description: "Whether to show line numbers",
    }),
  }),
  callbacks: {
    onChange: z.strictObject({
      value: z.string().meta({ description: "The updated code content" }),
    }),
  },
});
