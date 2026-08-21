import z from "zod";
import { createComponentDefinition } from "uicast";

export const CodeBlockDef = createComponentDefinition({
  name: "CodeBlock",
  description:
    "A syntax-highlighted read-only code display block. Renders code with a monospaced font, optional language label, and copy button. Use CodeBlock for displaying code snippets, API responses, configuration examples, etc.",
  props: z.strictObject({
    code: z.string().meta({
      description: "The code content to display",
    }),
    language: z.string().default("plaintext").meta({
      description: "The language label (e.g. javascript, python, json)",
    }),
    showLineNumbers: z.boolean().default(false).meta({
      description: "Whether to show line numbers",
    }),
    showCopyButton: z.boolean().default(true).meta({
      description: "Whether to show a copy-to-clipboard button",
    }),
  }),
  callbacks: {
    onCopy: z.strictObject({}).meta({
      description: "Callback when the code is copied to clipboard",
    }),
  },
});
