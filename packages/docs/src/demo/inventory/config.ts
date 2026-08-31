"use client";
import { allImplementations } from "@uicast/shadcn-catalog/impls";
import { resetInventory, seedIfEmpty } from "./seed";
import type { DemoConfig } from "../types";
import { inventoryFunctions } from "./functions";
import { inventoryLines } from "./inventory.lines";

/**
 * The original demo, now expressed as a {@link DemoConfig}. Its data layer
 * (Dexie + faker seed + the CRUD `standardTool`s) is unchanged — this just wraps
 * the existing modules so the shared player can host it. It's the only demo with
 * a real backend, so it's the only one wiring `onPlay`/`onReplay`.
 */
export const inventoryDemo: DemoConfig = {
  slug: "inventory",
  title: "Inventory",
  tagline:
    "A CRUD dashboard streamed entry-by-entry, backed by a live in-browser database.",
  lines: inventoryLines,
  functions: inventoryFunctions,
  catalog: [...allImplementations],
  onPlay: seedIfEmpty,
  onReplay: resetInventory,
};
