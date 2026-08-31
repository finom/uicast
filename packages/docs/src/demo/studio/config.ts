"use client";
import { allImplementations } from "@uicast/shadcn-catalog/impls";
import { KnobRenderer } from "../components/knob/renderer";
import type { DemoConfig } from "../types";
import { StepSequencerRenderer } from "./components/step-sequencer/renderer";
import { XYPadRenderer } from "./components/xy-pad/renderer";
import { studioFunctions } from "./functions";
import { studioLines } from "./studio.lines";

/**
 * The studio demo: catalog components for layout + chrome, plus three bespoke
 * components (XYPad, Knob, StepSequencer) whose custom event payloads drive a
 * single reactive `scopes.root` namespace. No data layer → no onPlay/onReplay.
 */
export const studioDemo: DemoConfig = {
  slug: "studio",
  title: "Groovebox",
  tagline:
    "A beat studio built from bespoke XY-pad, knob, and step-sequencer components — every interaction a custom event.",
  lines: studioLines,
  functions: studioFunctions,
  catalog: [
    ...allImplementations,
    XYPadRenderer,
    KnobRenderer,
    StepSequencerRenderer,
  ],
};
