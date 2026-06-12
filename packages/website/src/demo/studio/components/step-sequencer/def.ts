import { createAIComponentDef } from "@ui-fired/core/render/create-ai-component-def";
import z from "zod";

/**
 * Bespoke studio component: a tracks × steps grid. Its `onToggle` carries a
 * *grid-coordinate* payload — another shape the generic catalog has no notion
 * of, flowing through the same declarative callback pipeline.
 */
export const StepSequencerDef = createAIComponentDef({
  name: "StepSequencer",
  description:
    "A step-sequencer grid: one row per track, one cell per step. Click a cell to toggle it. Emits the toggled cell's coordinates and its new on/off state.",
  props: z.strictObject({
    tracks: z
      .array(
        z.object({
          id: z.string().meta({ description: "Track id" }),
          label: z.string().meta({ description: "Track label" }),
        }),
      )
      .meta({ description: "Grid rows, top to bottom" }),
    steps: z.number().default(16).meta({ description: "Number of step columns" }),
    pattern: z
      .array(z.array(z.boolean()))
      .meta({ description: "pattern[trackIndex][stepIndex] = is the cell active" }),
    playhead: z
      .number()
      .default(-1)
      .meta({ description: "Step column to highlight as the playhead (-1 = none)" }),
  }),
  callbacks: {
    onToggle: z.strictObject({
      track: z.string().meta({ description: "The toggled cell's track id" }),
      trackIndex: z.number().meta({ description: "The toggled cell's row index" }),
      step: z.number().meta({ description: "The toggled cell's step (column) index" }),
      on: z.boolean().meta({ description: "The cell's new on/off state" }),
    }),
  },
});
