import { impls } from "@uicast/shadcn-catalog/all/impls";
import { KnobImpl } from "../components/knob/impl";
import { demoManifest } from "../manifest";
import type { DemoConfig } from "../types";
import { ColorFieldImpl } from "./components/color-field/impl";
import { ColorPreviewImpl } from "./components/color-preview/impl";
import { SwatchRailImpl } from "./components/swatch-rail/impl";
import { colorLines } from "./color.lines";
import { colorFunctions } from "./functions";

export const colorDemo: DemoConfig = {
  slug: "color",
  ...demoManifest.color,
  lines: colorLines,
  functions: colorFunctions,
  catalog: [...impls, ColorFieldImpl, SwatchRailImpl, ColorPreviewImpl, KnobImpl],
};
