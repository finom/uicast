import z from "zod";
import { createComponentDefinition } from "@uicast/core";

export const LinkDef = createComponentDefinition({
  name: "Link",
  description:
    "A text link: an <a> element that opens `href` when clicked. With `external`, it opens in a new tab and shows an external-link icon. Use Link to go to another page or site, not for an action. The `text` prop sets the link text.",
  props: z.strictObject({
    text: z.union([z.string(), z.number()]).optional().meta({ description: "The link text content" }),
    href: z.string().meta({
      format: "uri-reference",
      description: "The address the link opens",
    }),
    variant: z.enum(["default", "muted", "destructive"]).default("default").meta({
      description: "Visual variant: default (primary color), muted (subtle), destructive (red)",
    }),
    size: z.enum(["sm", "default", "lg"]).default("default").meta({
      description: "Font size of the link",
    }),
    underline: z.enum(["always", "hover", "none"]).default("always").meta({
      description: "Underline behavior: always, hover, none",
    }),
    external: z.boolean().default(false).meta({
      description: "Open in a new tab, with an external-link icon",
    }),
  }),
});
