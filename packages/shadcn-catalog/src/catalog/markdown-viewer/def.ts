import z from "zod";
import { createComponentDefinition } from "@uicast/core";

export const MarkdownViewerDef = createComponentDefinition({
  name: "MarkdownViewer",
  description:
    "A rendered markdown content viewer supporting GitHub-flavored Markdown: headings, emphasis, links, lists, tables, blockquotes, and fenced code blocks. Use MarkdownViewer for documentation pages, README displays, rich content rendering, or any markdown-formatted text.",
  props: z.strictObject({
    content: z.string().meta({
      description: "The markdown content string to render",
    }),
  }),
});
