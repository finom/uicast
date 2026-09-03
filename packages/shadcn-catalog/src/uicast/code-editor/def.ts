import z from "zod";
import { createComponentDefinition } from "@uicast/core";
import { languageSchema } from "../../lib/languages";

export const CodeEditorDef = createComponentDefinition({
  name: "CodeEditor",
  description:
    "A plain-text code input area. Renders a monospaced textarea with line numbers for code editing — no syntax highlighting. Use CodeEditor for configuration input, code snippets, template editing, or any structured text entry.",
  props: z.strictObject({
    value: z.string().default("").meta({
      description: "The code content",
    }),
    language: languageSchema.default("javascript").meta({
      description: "The language label. Metadata only — the content is not highlighted.",
    }),
    placeholder: z.string().default("Enter code...").meta({
      description: "Placeholder text",
    }),
    disabled: z.boolean().default(false).meta({
      description: "Whether the editor is disabled",
    }),
    minHeight: z.number().int().positive().default(200).meta({
      description: "Minimum height in pixels.",
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
