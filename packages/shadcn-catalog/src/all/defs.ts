import type { ComponentDefinition } from "@uicast/core";
import * as charts from "../charts/defs";
import * as content from "../content/defs";
import * as data from "../data/defs";
import * as forms from "../forms/defs";
import * as layout from "../layout/defs";
import * as navigation from "../navigation/defs";
import * as overlays from "../overlays/defs";

export * from "../layout/defs";
export * from "../content/defs";
export * from "../data/defs";
export * from "../charts/defs";
export * from "../forms/defs";
export * from "../navigation/defs";
export * from "../overlays/defs";

// Declared here, so it replaces the `defs` each group exports.
export const defs: ComponentDefinition[] = [
  ...layout.defs,
  ...content.defs,
  ...data.defs,
  ...charts.defs,
  ...forms.defs,
  ...navigation.defs,
  ...overlays.defs,
];
