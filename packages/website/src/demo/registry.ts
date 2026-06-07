import { boardDemo } from "./board/config";
import { colorDemo } from "./color/config";
import { inventoryDemo } from "./inventory/config";
import { studioDemo } from "./studio/config";
import type { DemoConfig } from "./types";

/**
 * The runtime demo registry. Each entry carries client-land values (renderer
 * functions, host-function closures, the artifact), so this module is imported
 * **only** from the client side (`[demo]/DemoRoute.tsx`). Server code reads
 * `manifest.ts` instead. Insertion order = home-page card order. **Keep slugs
 * in sync with `manifest.ts`.**
 */
export const demos: DemoConfig[] = [
  inventoryDemo,
  studioDemo,
  colorDemo,
  boardDemo,
];

const demosBySlug: Record<string, DemoConfig> = Object.fromEntries(
  demos.map((d) => [d.slug, d]),
);

export function getDemo(slug: string): DemoConfig | undefined {
  return demosBySlug[slug];
}
