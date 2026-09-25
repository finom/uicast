import { boardDemo } from "./board/config";
import { colorDemo } from "./color/config";
import { inventoryDemo } from "./inventory/config";
import { studioDemo } from "./studio/config";
import type { DemoConfig } from "./types";

// Client-only: implementations and closures. Keep slugs in sync with `manifest.ts`.
const demos = [inventoryDemo, studioDemo, colorDemo, boardDemo];

export const getDemo = (slug: string): DemoConfig | undefined => demos.find((demo) => demo.slug === slug);
