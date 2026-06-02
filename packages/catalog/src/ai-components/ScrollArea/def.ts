import z from "zod";
import { createAIComponentDef } from "ui-fired/core/render/createAIComponentDef";

export const ScrollAreaDef = createAIComponentDef({
  name: "ScrollArea",
  description:
    "A custom styled scrollable region. Renders a container with custom scrollbars that match the app theme. Use ScrollArea for sidebars, long lists, code blocks, or any content that overflows its container.",
  props: z.strictObject({
    height: z.string().default("300px").meta({
      description: "Maximum height before scrolling, e.g. '300px' or '50vh'",
    }),
    width: z.string().optional().meta({
      description: "Optional width, e.g. '100%' or '400px'",
    }),
    orientation: z
      .enum(["vertical", "horizontal", "both"])
      .default("vertical")
      .meta({
        description: "Scroll direction",
      }),
  }),
});
