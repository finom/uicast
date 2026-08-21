import z from "zod";
import { createComponentDefinition } from "uicast";

export const HighlightDef = createComponentDefinition({
  name: "Highlight",
  description:
    "A text highlighting/search match marking component. Highlights specified text within content. Use Highlight for search result highlighting, keyword emphasis, or marking important text.",
  props: z.strictObject({
    text: z.string().meta({
      description: "The full text content",
    }),
    highlight: z.string().meta({
      description: "The text to highlight within the content",
    }),
    color: z.string().default("yellow").meta({
      description: "Highlight color: yellow, green, blue, red, or a CSS color",
    }),
    caseSensitive: z.boolean().default(false).meta({
      description: "Whether matching is case sensitive",
    }),
  }),
});
