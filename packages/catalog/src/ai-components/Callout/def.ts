import z from "zod";
import { createAIComponentDef } from "ui-fired/core/render/createAIComponentDef";

export const CalloutDef = createAIComponentDef({
  name: "Callout",
  description:
    "A highlighted info/tip/warning/error block. Renders a styled callout box with an icon and content. Use Callout for important notices, tips, warnings, or error messages within content flow.",
  props: z.strictObject({
    variant: z
      .enum(["info", "tip", "warning", "error", "note"])
      .default("info")
      .meta({
        description: "The callout type that determines icon and color",
      }),
    title: z.string().optional().meta({
      description: "Optional callout title",
    }),
  }),
});
