import { impls } from "@uicast/shadcn-catalog/all-impls";
import { KnobRenderer } from "../components/knob/renderer";
import { demoManifest } from "../manifest";
import type { DemoConfig } from "../types";
import { StepSequencerRenderer } from "./components/step-sequencer/renderer";
import { XYPadRenderer } from "./components/xy-pad/renderer";
import { studioFunctions } from "./functions";
import { studioLines } from "./studio.lines";

export const studioDemo: DemoConfig = {
  slug: "studio",
  ...demoManifest.studio,
  lines: studioLines,
  functions: studioFunctions,
  catalog: [
    ...impls,
    XYPadRenderer,
    KnobRenderer,
    StepSequencerRenderer,
  ],
};
