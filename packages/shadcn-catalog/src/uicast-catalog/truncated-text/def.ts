import z from "zod";
import { createComponentDefinition } from "@uicast/core";

export const TruncatedTextDef = createComponentDefinition({
  name: "TruncatedText",
  description:
    "Ellipsis text for overflow. Truncates long text to `maxLines` lines, with an optional Show more / Show less toggle. Use TruncatedText for table cells, card descriptions, or any constrained text area.",
  props: z.strictObject({
    text: z.string().meta({
      description: "The full text content",
    }),
    maxLines: z.number().int().min(1).default(2).meta({
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
