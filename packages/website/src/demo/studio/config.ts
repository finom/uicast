"use client";
import { componentRenderers } from "@ui-fired/catalog/render/renderers";
import { KnobRenderer } from "../components/Knob/renderer";
import type { DemoConfig } from "../types";
import { StepSequencerRenderer } from "./components/StepSequencer/renderer";
import { XYPadRenderer } from "./components/XYPad/renderer";
import { studioFunctions } from "./functions";
import { studioLines } from "./studio.lines";
import { studioPrompt } from "./studio.prompt";

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
  prompt: studioPrompt,
  lines: studioLines,
  functions: studioFunctions,
  catalog: [
    ...componentRenderers,
    XYPadRenderer,
    KnobRenderer,
    StepSequencerRenderer,
  ],
};
