/**
 * Server-safe demo metadata — the ONLY demo module a Server Component may import.
 * It deliberately has zero imports of configs / lines / functions, so the home
 * page, `generateStaticParams`, and `generateMetadata` never pull renderer or
 * Dexie code onto the server/build path. The full runtime configs live in
 * `registry.ts` (client-only). **Keep these slugs in sync with `registry.ts`.**
 */
export interface DemoMeta {
  slug: string;
  title: string;
  tagline: string;
}

export const demoManifest: DemoMeta[] = [
  {
    slug: "inventory",
    title: "Inventory",
    tagline:
      "A CRUD dashboard streamed chunk-by-chunk, backed by a live in-browser database.",
  },
  {
    slug: "studio",
    title: "Groovebox",
    tagline:
      "A beat studio built from bespoke XY-pad, knob, and step-sequencer components — every interaction a custom event.",
  },
  {
    slug: "color",
    title: "Palette studio",
    tagline:
      "A color picker from bespoke field, swatch, and preview components — picking emits a structured { hex, h, s, l } payload.",
  },
];

export const demoSlugs = demoManifest.map((d) => d.slug);
