import { impls } from "@uicast/shadcn-catalog/all/impls";
import { KnobImpl } from "../components/knob/impl";
import { demoManifest } from "../manifest";
import type { DemoConfig } from "../types";
import { StepSequencerImpl } from "./components/step-sequencer/impl";
import { XYPadImpl } from "./components/xy-pad/impl";
import { studioFunctions } from "./functions";
import { studioLines } from "./studio.lines";

export const studioDemo: DemoConfig = {
  slug: "studio",
  ...demoManifest.studio,
  lines: studioLines,
  functions: studioFunctions,
  catalog: [...impls, XYPadImpl, KnobImpl, StepSequencerImpl],
};
