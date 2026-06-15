import z from "zod";
import { createComponentDefinition } from "@ui-fired/core/def/create-component-definition";

export const CopyButtonDef = createComponentDefinition({
  name: "CopyButton",
  description:
    "A click-to-copy button with visual feedback. Copies specified text to clipboard and shows a checkmark on success. Use CopyButton for API keys, URLs, IDs, or any text that users need to copy.",
  props: z.strictObject({
    text: z.string().meta({
      description: "The text to copy to clipboard",
    }),
    label: z.string().default("Copy").meta({
      description: "Button label text",
    }),
    variant: z
      .enum(["default", "outline", "ghost", "secondary"])
      .default("outline")
      .meta({
        description: "Button variant",
      }),
    size: z.enum(["default", "sm", "lg", "icon"]).default("sm").meta({
      description: "Button size",
    }),
  }),
  callbacks: {
    onCopy: z.strictObject({
      text: z.string().meta({ description: "The text that was copied" }),
    }),
  },
});
