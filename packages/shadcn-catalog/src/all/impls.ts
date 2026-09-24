import type { ComponentImplementation } from "@uicast/react";
import * as charts from "../charts/impls";
import * as content from "../content/impls";
import * as data from "../data/impls";
import * as forms from "../forms/impls";
import * as layout from "../layout/impls";
import * as navigation from "../navigation/impls";
import * as overlays from "../overlays/impls";

export * from "../layout/impls";
export * from "../content/impls";
export * from "../data/impls";
export * from "../charts/impls";
export * from "../forms/impls";
export * from "../navigation/impls";
export * from "../overlays/impls";

// Declared here, so it replaces the `impls` each group exports.
export const impls: ComponentImplementation[] = [
  ...layout.impls,
  ...content.impls,
  ...data.impls,
  ...charts.impls,
  ...forms.impls,
  ...navigation.impls,
  ...overlays.impls,
];
