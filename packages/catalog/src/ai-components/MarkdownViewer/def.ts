import z from "zod";
import { createAIComponentDef } from "@ui-fired/core/render/createAIComponentDef";

export const MarkdownViewerDef = createAIComponentDef({
  name: "MarkdownViewer",
  description:
    "A rendered markdown content viewer. Displays markdown formatted text with proper styling. Use MarkdownViewer for documentation pages, README displays, rich content rendering, or any markdown-formatted text.",
  props: z.strictObject({
    content: z.string().meta({
      description: "The markdown content string to render",
    }),
  }),
});
