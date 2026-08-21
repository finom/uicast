import z from "zod";
import { createComponentDefinition } from "uicast";

export const TruncatedTextDef = createComponentDefinition({
  name: "TruncatedText",
  description:
    "Ellipsis text with expand/tooltip for overflow. Truncates long text with an option to expand or show full text on hover. Use TruncatedText for table cells, card descriptions, or any constrained text area.",
  props: z.strictObject({
    text: z.string().meta({
      description: "The full text content",
    }),
    maxLines: z.number().default(2).meta({
      description: "Maximum number of lines before truncation",
    }),
    expandable: z.boolean().default(true).meta({
      description: "Whether clicking reveals the full text",
    }),
  }),
  callbacks: {
    onToggle: z.strictObject({
      expanded: z.boolean().meta({ description: "The new expanded state" }),
    }),
  },
});
