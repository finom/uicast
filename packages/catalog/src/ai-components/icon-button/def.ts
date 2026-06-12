import z from "zod";
import { createAIComponentDef } from "@ui-fired/core/render/create-ai-component-def";
import { onClickSchema } from "@ui-fired/catalog/render/shared";

export const IconButtonDef = createAIComponentDef({
  name: "IconButton",
  description:
    "A square icon-only button. Renders a button containing a single Lucide icon. Use IconButton for toolbar actions, close buttons, toggle buttons, or any action where an icon alone is sufficient. For a button with text, use Button instead.",
  props: z.strictObject({
    icon: z.string().meta({
      description:
        "The Lucide icon name in PascalCase, e.g. 'X', 'Plus', 'Trash2', 'Edit', 'Search'",
    }),
    variant: z
      .enum(["default", "destructive", "outline", "secondary", "ghost"])
      .default("ghost")
      .meta({
        description: "Visual variant for the button",
      }),
    size: z.enum(["default", "sm", "lg"]).default("default").meta({
      description: "Button size: sm (32px), default (36px), lg (40px)",
    }),
    disabled: z.boolean().default(false).meta({
      description: "Whether the button is disabled",
    }),
    tooltip: z.string().optional().meta({
      description: "Optional tooltip text shown on hover",
    }),
  }),
  callbacks: {
    onClick: onClickSchema,
  },
});
