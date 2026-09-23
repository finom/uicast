import z from "zod";
import { createComponentDefinition } from "@uicast/core";
import { languageSchema } from "../../lib/languages";

export const CodeBlockDef = createComponentDefinition({
  name: "CodeBlock",
  description:
    "A read-only code display block. Renders code with a monospaced font, optional language label, and copy button. Use CodeBlock for displaying code snippets, API responses, configuration examples, etc.",
  props: z.strictObject({
    code: z.string().meta({
      description: "The code content to display",
    }),
    language: languageSchema.default("plaintext").meta({
      description: "The language shown in the header label.",
    }),
    showLineNumbers: z.boolean().default(false).meta({
      description: "Whether to show line numbers",
    }),
    showCopyButton: z.boolean().default(true).meta({
      description: "Whether to show a copy-to-clipboard button",
    }),
  }),
  callbacks: {
    onCopy: z.null().meta({
      description: "Callback when the code is copied to clipboard",
    }),
  },
});
