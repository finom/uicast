"use client";
import { impls } from "@uicast/shadcn-catalog/all-impls";
import { KnobRenderer } from "../components/knob/renderer";
import type { DemoConfig } from "../types";
import { ColorFieldRenderer } from "./components/color-field/renderer";
import { ColorPreviewRenderer } from "./components/color-preview/renderer";
import { SwatchRailRenderer } from "./components/swatch-rail/renderer";
import { colorLines } from "./color.lines";
import { colorFunctions } from "./functions";

/**
 * The color demo: bespoke ColorField + SwatchRail + ColorPreview components,
 * plus the shared Knob (here driving alpha). Picking emits a structured
 * { hex, h, s, l } payload that updates the whole reactive `scopes.root`.
 */
export const colorDemo: DemoConfig = {
  slug: "color",
  title: "Palette studio",
  tagline:
    "A color picker from bespoke field, swatch, and preview components — picking emits a structured { hex, h, s, l } payload.",
  lines: colorLines,
  functions: colorFunctions,
  catalog: [
    ...impls,
    ColorFieldRenderer,
    SwatchRailRenderer,
    ColorPreviewRenderer,
    KnobRenderer,
  ],
};
