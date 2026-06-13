import { createComponentDefinition } from "@ui-fired/core/render/create-component-definition";
import z from "zod";

/**
 * Bespoke color component: a saturation × lightness field plus a hue strip. Its
 * `onPick` carries a *structured, multi-channel* payload — `{ hex, h, s, l }` all
 * at once — the clearest proof that `evt` is whatever the component decides.
 */
export const ColorFieldDef = createComponentDefinition({
  name: "ColorField",
  description:
    "A 2-D color field (saturation × lightness) plus a hue strip. Click or drag either surface; emits the chosen color as { hex, h, s, l }.",
  props: z.strictObject({
    h: z.number().default(220).meta({ description: "Hue, 0..360" }),
    s: z.number().default(80).meta({ description: "Saturation, 0..100" }),
    l: z.number().default(55).meta({ description: "Lightness, 0..100" }),
  }),
  callbacks: {
    onPick: z.strictObject({
      hex: z
        .string()
        .meta({ description: "The picked color as a #rrggbb hex string" }),
      h: z.number().meta({ description: "Hue, 0..360" }),
      s: z.number().meta({ description: "Saturation, 0..100" }),
      l: z.number().meta({ description: "Lightness, 0..100" }),
    }),
  },
});
