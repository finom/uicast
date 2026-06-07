"use client";
import { componentRenderers } from "@ui-fired/catalog/render/renderers";
import { KnobRenderer } from "../components/Knob/renderer";
import type { DemoConfig } from "../types";
import { ColorFieldRenderer } from "./components/ColorField/renderer";
import { ColorPreviewRenderer } from "./components/ColorPreview/renderer";
import { SwatchRailRenderer } from "./components/SwatchRail/renderer";
import { colorLines } from "./color.lines";
import { colorPrompt } from "./color.prompt";
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
  prompt: colorPrompt,
  lines: colorLines,
  functions: colorFunctions,
  catalog: [
    ...componentRenderers,
    ColorFieldRenderer,
    SwatchRailRenderer,
    ColorPreviewRenderer,
    KnobRenderer,
  ],
};
