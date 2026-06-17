import type { ComponentEntry } from "@ui-fired/core";
import type { ComponentImplementation } from "@ui-fired/react";
import type { RendererOverrides } from "@ui-fired/react/types";
import type { StandardTool } from "standard-tool";

/**
 * Everything the reusable {@link DemoPlayer} needs to host one demo. A demo *is*
 * just a config: a hand-authored artifact (`lines`), its landing copy, the
 * catalog + host functions the engine renders it with, and optional
 * data-lifecycle hooks. Adding a demo = adding one of these to the registry
 * (`registry.ts`) plus a matching entry in `manifest.ts`.
 */
export interface DemoConfig {
  /** URL slug + registry key + React key on `<DemoPlayer>`. Unique. */
  slug: string;
  /** Header label, landing `<h1>`, and per-route `<title>`. */
  title: string;
  /** One-line description shown on the home card. */
  tagline: string;
  /** Landing "THE PROMPT" body text. */
  prompt: string;
  /** The hand-authored JSONLines artifact, revealed one entry at a time. */
  lines: ComponentEntry[];
  /** Host functions exposed to expressions. `[]` when the demo has no data layer. */
  functions: StandardTool[];
  /** Base catalog + the demo's bespoke renderers: `[...componentImplementations, ...bespoke]`. */
  catalog: ComponentImplementation[];
  /** Host overrides for the engine's own UI (e.g. a custom skeleton). Falls back to RenderCanvas' default. */
  overrides?: RendererOverrides;
  /** Runs on first Play, before the count resets. Inventory → `seedIfEmpty`. */
  onPlay?: () => void | Promise<void>;
  /** Runs on Replay (wipe + reseed). Inventory → `resetInventory`. */
  onReplay?: () => void | Promise<void>;
}
