import type { ComponentEntry } from "@uicast/core";
import * as chartDefs from "@uicast/shadcn-catalog/charts/defs";
import * as contentDefs from "@uicast/shadcn-catalog/content/defs";
import * as dataDefs from "@uicast/shadcn-catalog/data/defs";
import * as essentialDefs from "@uicast/shadcn-catalog/essential/defs";
import * as formDefs from "@uicast/shadcn-catalog/forms/defs";
import * as layoutDefs from "@uicast/shadcn-catalog/layout/defs";
import * as navigationDefs from "@uicast/shadcn-catalog/navigation/defs";
import * as overlayDefs from "@uicast/shadcn-catalog/overlays/defs";
import { charts } from "./charts";
import { content } from "./content";
import { data } from "./data";
import { forms } from "./forms";
import { layout } from "./layout";
import { navigation } from "./navigation";
import { overlays } from "./overlays";

// Read from the registries, so the gallery follows the catalog.
export const GROUPS = {
  layout: layoutDefs.defs,
  content: contentDefs.defs,
  data: dataDefs.defs,
  charts: chartDefs.defs,
  forms: formDefs.defs,
  navigation: navigationDefs.defs,
  overlays: overlayDefs.defs,
};

export type Group = keyof typeof GROUPS;

export const ESSENTIAL = new Set(essentialDefs.defs.map((def) => def.name));

// A document whose first entry is the root, or the name of the component whose example shows this one (a part such as
// `TabTrigger`).
export type Example = ComponentEntry[] | string;

export const EXAMPLES: Record<string, Example> = {
  ...layout,
  ...content,
  ...data,
  ...charts,
  ...forms,
  ...navigation,
  ...overlays,
};
