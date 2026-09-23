import * as chartDefs from "../charts/defs";
import * as chartImpls from "../charts/impls";
import * as contentDefs from "../content/defs";
import * as contentImpls from "../content/impls";
import * as dataDefs from "../data/defs";
import * as dataImpls from "../data/impls";
import * as formDefs from "../forms/defs";
import * as formImpls from "../forms/impls";
import * as layoutDefs from "../layout/defs";
import * as layoutImpls from "../layout/impls";
import * as navigationDefs from "../navigation/defs";
import * as navigationImpls from "../navigation/impls";
import * as overlayDefs from "../overlays/defs";
import * as overlayImpls from "../overlays/impls";

// Each group the way a host reads it: `Object.values` of `import * as`.
export const groups = {
  layout: { defs: Object.values(layoutDefs), impls: Object.values(layoutImpls) },
  content: { defs: Object.values(contentDefs), impls: Object.values(contentImpls) },
  data: { defs: Object.values(dataDefs), impls: Object.values(dataImpls) },
  charts: { defs: Object.values(chartDefs), impls: Object.values(chartImpls) },
  forms: { defs: Object.values(formDefs), impls: Object.values(formImpls) },
  navigation: { defs: Object.values(navigationDefs), impls: Object.values(navigationImpls) },
  overlays: { defs: Object.values(overlayDefs), impls: Object.values(overlayImpls) },
};

export const groupDefs = Object.values(groups).flatMap((group): readonly { name: string }[] => group.defs);
