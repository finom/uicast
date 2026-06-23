import { createComponentDefinition } from "@ui-fired/core";
import z from "zod";

/**
 * Bespoke studio component: a 2-D control surface. Its `onMove` carries a
 * *spatial* payload `{ x, y }` — the kind of event a generic form catalog can't
 * produce, but the one `callbacks` mechanism handles it like any other.
 */
export const XYPadDef = createComponentDefinition({
  name: "XYPad",
  description:
    "A two-dimensional control surface. Drag the puck anywhere in the pad; emits its position as { x, y }, each axis from 0 (left / bottom) to 1 (right / top).",
  props: z.strictObject({
    x: z.number().default(0.5).meta({ description: "Puck X, 0..1 (left→right)" }),
    y: z.number().default(0.5).meta({ description: "Puck Y, 0..1 (bottom→top)" }),
    xLabel: z
      .string()
      .optional()
      .meta({ description: "Caption for the X axis" }),
    yLabel: z
      .string()
      .optional()
      .meta({ description: "Caption for the Y axis" }),
  }),
  callbacks: {
    onMove: z.strictObject({
      x: z.number().meta({ description: "Puck X position, 0..1" }),
      y: z.number().meta({ description: "Puck Y position, 0..1" }),
    }),
  },
});
