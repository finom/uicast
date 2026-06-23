export const studioPrompt = `Build a browser "groovebox" — a little beat studio — from bespoke instrument
components, no backend.

Components (each emits its own custom event payload):
- XYPad — a 2-D filter pad; dragging emits { x, y }, 0..1 on each axis.
- Knob — a rotary control; turning emits { value }.
- StepSequencer — a tracks × steps grid; clicking a cell emits
  { track, trackIndex, step, on }.

Wire them into one reactive "synth" scope:
- The XY pad drives a live filter readout — cutoff in Hz from x, resonance Q
  from y.
- Three knobs set cutoff / resonance / drive.
- The sequencer toggles a 3-track, 16-step pattern (kick / snare / hat).
- A "Randomize" button calls a host function to regenerate the pattern.
- A "Clear" button wipes the pattern behind a confirm prompt.
- A "Last event" panel always shows the most recent component event, verbatim,
  so you can watch each payload flow through.`;
