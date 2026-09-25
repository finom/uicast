import { createComponentDefinition } from "@uicast/core";
import z from "zod";

export const XYPadDef = createComponentDefinition({
  name: "XYPad",
  description:
    "A two-dimensional control surface. Drag the puck anywhere in the pad; emits its position as { x, y }, each axis from 0 (left / bottom) to 1 (right / top).",
  props: z.strictObject({
    x: z.number().default(0.5).meta({ description: "Puck X, 0..1 (left→right)" }),
    y: z.number().default(0.5).meta({ description: "Puck Y, 0..1 (bottom→top)" }),
    xLabel: z.string().optional().meta({ description: "Caption for the X axis" }),
    yLabel: z.string().optional().meta({ description: "Caption for the Y axis" }),
  }),
  callbacks: {
    onMove: z.strictObject({
      x: z.number().meta({ description: "Puck X position, 0..1" }),
      y: z.number().meta({ description: "Puck Y position, 0..1" }),
    }),
  },
});
