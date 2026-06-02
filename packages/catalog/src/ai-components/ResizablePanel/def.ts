import z from "zod";
import { createAIComponentDef } from "ui-fired/core/render/createAIComponentDef";

export const ResizablePanelDef = createAIComponentDef({
  name: "ResizablePanel",
  description:
    "Draggable split panes for resizable layouts. Renders two panels separated by a draggable handle. Use ResizablePanel for code editors with preview, master-detail layouts, or any side-by-side resizable content.",
  props: z.strictObject({
    direction: z.enum(["horizontal", "vertical"]).default("horizontal").meta({
      description:
        "Split direction: horizontal (left-right) or vertical (top-bottom)",
    }),
    defaultSize: z.number().default(50).meta({
      description: "Default size of the first panel as a percentage (0-100)",
    }),
    minSize: z.number().default(20).meta({
      description: "Minimum size of panels as a percentage",
    }),
  }),
});
