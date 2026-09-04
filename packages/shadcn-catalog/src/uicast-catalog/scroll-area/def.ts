import z from "zod";
import { createComponentDefinition } from "@uicast/core";

export const ScrollAreaDef = createComponentDefinition({
  name: "ScrollArea",
  description:
    "A custom styled scrollable region. Renders a container with custom scrollbars that match the app theme. Use ScrollArea for sidebars, long lists, code blocks, or any content that overflows its container.",
  props: z.strictObject({
    height: z.number().int().positive().default(300).meta({
      description: "Height in pixels before the content scrolls.",
    }),
    width: z.number().int().positive().optional().meta({
      description: "Optional width in pixels. Fills its container when unset.",
    }),
    orientation: z
      .enum(["vertical", "horizontal", "both"])
      .default("vertical")
      .meta({
        description: "Scroll direction",
      }),
  }),
});
