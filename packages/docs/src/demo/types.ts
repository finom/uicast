import type { ComponentEntry } from "@uicast/core";
import type { ComponentImplementation } from "@uicast/react";
import type { StandardToolV0 } from "standard-tool";
import type { DemoMeta } from "./manifest";

// A new demo is one of these in `registry.ts` plus an entry in `manifest.ts`.
export interface DemoConfig extends DemoMeta {
  // URL slug, registry key and React key on `<DemoPlayer>`.
  slug: string;
  lines: ComponentEntry[];
  functions: StandardToolV0[];
  catalog: ComponentImplementation[];
  onPlay?: () => void | Promise<void>;
  onReplay?: () => void | Promise<void>;
}
