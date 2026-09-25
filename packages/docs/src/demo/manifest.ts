// The only demo module a Server Component may import.
export interface DemoMeta {
  title: string;
  tagline: string;
}

export const demoManifest: Record<string, DemoMeta> = {
  inventory: {
    title: "Inventory",
    tagline: "A CRUD dashboard streamed entry-by-entry, backed by a live in-browser database.",
  },
  studio: {
    title: "Groovebox",
    tagline:
      "A beat studio built from bespoke XY-pad, knob, and step-sequencer components — every interaction a custom event.",
  },
  color: {
    title: "Palette studio",
    tagline:
      "A color picker from bespoke field, swatch, and preview components — picking emits a structured { hex, h, s, l } payload.",
  },
  board: {
    title: "Flow board",
    tagline:
      "A node canvas from one bespoke component — dragging emits a spatial { id, x, y }, wiring two nodes emits a relational { from, to }.",
  },
};
