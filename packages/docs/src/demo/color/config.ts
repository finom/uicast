import { impls } from "@uicast/shadcn-catalog/all-impls";
import { KnobRenderer } from "../components/knob/renderer";
import { demoManifest } from "../manifest";
import type { DemoConfig } from "../types";
import { ColorFieldRenderer } from "./components/color-field/renderer";
import { ColorPreviewRenderer } from "./components/color-preview/renderer";
import { SwatchRailRenderer } from "./components/swatch-rail/renderer";
import { colorLines } from "./color.lines";
import { colorFunctions } from "./functions";

export const colorDemo: DemoConfig = {
  slug: "color",
  ...demoManifest.color,
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
