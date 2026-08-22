import { createComponentDefinition } from "@uicast/core";
import z from "zod";

/**
 * Bespoke color component: a row of saved swatches. Selecting one emits its
 * index plus the full color decomposition `{ index, hex, h, s, l }`, so the
 * callback can restore every channel at once.
 */
export const SwatchRailDef = createComponentDefinition({
  name: "SwatchRail",
  description:
    "A row of color swatches. Click one to select it; emits { index, hex, h, s, l }.",
  props: z.strictObject({
    swatches: z
      .array(z.string())
      .meta({ description: "Hex colors to show, left to right" }),
    selected: z
      .string()
      .optional()
      .meta({ description: "Currently selected hex (for highlight)" }),
  }),
  callbacks: {
    onSelect: z.strictObject({
      index: z.number().meta({ description: "Index of the clicked swatch" }),
      hex: z.string().meta({ description: "Hex of the clicked swatch" }),
      h: z.number().meta({ description: "Hue of the clicked swatch, 0..360" }),
      s: z.number().meta({ description: "Saturation, 0..100" }),
      l: z.number().meta({ description: "Lightness, 0..100" }),
    }),
  },
});
