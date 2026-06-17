"use client";
import { allImplementations } from "@ui-fired/catalog/impls";
import { inventoryFunctions } from "@/lib/functions";
import { resetInventory, seedIfEmpty } from "@/lib/seed";
import { inventoryLines } from "../inventory.lines";
import { inventoryPrompt } from "../inventory.prompt";
import type { DemoConfig } from "../types";

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
  prompt: inventoryPrompt,
  lines: inventoryLines,
  functions: inventoryFunctions,
  catalog: [...allImplementations],
  onPlay: seedIfEmpty,
  onReplay: resetInventory,
};
