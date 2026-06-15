import { createComponentDefinition } from "@ui-fired/core/def/create-component-definition";
import z from "zod";

/**
 * Bespoke color component (display-only — no callbacks). It purely *reflects*
 * scope: a swatch over a checkerboard so the alpha channel is visible. Proves
 * the other half of the loop — events write scope, reactive props read it back.
 */
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
