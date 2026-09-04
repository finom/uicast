import z from "zod";
import { createComponentDefinition } from "@uicast/core";

export const TooltipDef = createComponentDefinition({
  name: "Tooltip",
  description:
    "A tooltip that shows additional information on hover. Wraps any child component and displays a text tooltip when the user hovers over it. Use Tooltip for icon buttons that need labels, truncated text that needs full display, or any element that benefits from hover-revealed context.",
  props: z.strictObject({
    content: z.string().meta({
      description: "The tooltip text to display on hover",
    }),
    side: z.enum(["top", "bottom", "left", "right"]).default("top").meta({
      description: "Which side of the trigger to show the tooltip",
    }),
  }),
});
