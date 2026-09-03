import z from "zod";
import { createComponentDefinition } from "@uicast/core";

export const LinkDef = createComponentDefinition({
  name: "Link",
  description:
    "A styled navigable link for internal or external navigation. Renders an anchor-style text element. Use Link for text navigation, breadcrumb-like inline links, or any clickable text that navigates. The `text` prop sets the link text.",
  props: z.strictObject({
    text: z.union([z.string(), z.number()]).optional().meta({ description: "The link text content" }),
    href: z.string().optional().meta({
      format: "uri-reference",
      description: "The URL to navigate to (for display purposes)",
    }),
    variant: z
      .enum(["default", "muted", "destructive"])
      .default("default")
      .meta({
        description:
          "Visual variant: default (primary color), muted (subtle), destructive (red)",
      }),
    size: z.enum(["sm", "default", "lg"]).default("default").meta({
      description: "Font size of the link",
    }),
    underline: z.enum(["always", "hover", "none"]).default("hover").meta({
      description: "Underline behavior: always, hover, none",
    }),
    external: z.boolean().default(false).meta({
      description: "Whether the link opens in a new tab (shows external icon)",
    }),
    disabled: z.boolean().default(false).meta({
      description: "Whether the link is disabled",
    }),
  }),
  callbacks: {
    onClick: z
      .strictObject({
        href: z.string().optional().meta({
          description: "The href value of the clicked link",
        }),
      })
      .meta({ description: "Callback when the link is clicked" }),
  },
});
