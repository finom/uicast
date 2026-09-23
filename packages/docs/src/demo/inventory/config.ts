import { impls } from "@uicast/shadcn-catalog/all-impls";
import { resetInventory, seedIfEmpty } from "./seed";
import { demoManifest } from "../manifest";
import type { DemoConfig } from "../types";
import { inventoryFunctions } from "./functions";
import { inventoryLines } from "./inventory.lines";

export const inventoryDemo: DemoConfig = {
  slug: "inventory",
  ...demoManifest.inventory,
  lines: inventoryLines,
  functions: inventoryFunctions,
  catalog: impls,
  onPlay: seedIfEmpty,
  onReplay: resetInventory,
};
