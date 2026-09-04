import z from "zod";
import { createComponentDefinition } from "@uicast/core";

export const TextDef = createComponentDefinition({
  name: "Text",
  description:
    "A text display component for rendering inline or block text. Renders a span (inline) or p (block) element. Use Text for body copy, labels, descriptions, or any general-purpose text content. Pass a dynamic value through the `text` prop.",
  props: z.strictObject({
    text: z
      .union([z.string(), z.number()])
      .optional()
      .meta({ description: "The text content to display" }),
    variant: z
      .enum(["body", "muted", "lead", "small", "large"])
      .default("body")
      .meta({
        description:
          "Text style variant: body (default), muted (gray, secondary info), lead (larger intro text), small (smaller text), large (bigger text)",
      }),
    as: z.enum(["span", "p", "div"]).default("span").meta({
      description:
        "HTML element to render: span (inline), p (paragraph), div (block)",
    }),
  }),
});
