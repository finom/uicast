import { boardDemo } from "./board/config";
import { colorDemo } from "./color/config";
import { inventoryDemo } from "./inventory/config";
import { studioDemo } from "./studio/config";
import type { DemoConfig } from "./types";

// Client-only: renderer functions and closures. Keep slugs in sync with `manifest.ts`.
const demos: DemoConfig[] = [
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
