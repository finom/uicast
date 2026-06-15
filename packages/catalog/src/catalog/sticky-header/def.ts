import z from "zod";
import { createComponentDefinition } from "@ui-fired/core";

export const StickyHeaderDef = createComponentDefinition({
  name: "StickyHeader",
  description:
    "Content that pins to the top on scroll. Renders a header bar that becomes fixed when scrolled past. Use StickyHeader for page titles with actions, toolbars, or any content that should remain visible when scrolling.",
  props: z.strictObject({
    zIndex: z.number().default(10).meta({
      description: "z-index for stacking context",
    }),
    bordered: z.boolean().default(true).meta({
      description: "Whether to show a bottom border",
    }),
    blurred: z.boolean().default(true).meta({
      description: "Whether to apply a backdrop blur effect",
    }),
  }),
});
