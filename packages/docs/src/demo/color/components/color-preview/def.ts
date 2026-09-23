import { createComponentDefinition } from "@uicast/core";
import z from "zod";

export const ColorPreviewDef = createComponentDefinition({
  name: "ColorPreview",
  description:
    "A read-only swatch previewing the current color at a given alpha, over a checkerboard.",
  props: z.strictObject({
    hex: z.string().default("#000000").meta({ description: "Hex color to show" }),
    alpha: z.number().default(100).meta({ description: "Opacity, 0..100" }),
    label: z
      .string()
      .optional()
      .meta({ description: "Caption (defaults to the hex)" }),
  }),
});
