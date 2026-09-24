import * as allDefs from "../all/defs";
import * as allImpls from "../all/impls";
import * as chartDefs from "../charts/defs";
import * as chartImpls from "../charts/impls";
import * as contentDefs from "../content/defs";
import * as contentImpls from "../content/impls";
import * as dataDefs from "../data/defs";
import * as dataImpls from "../data/impls";
import * as essentialDefs from "../essential/defs";
import * as essentialImpls from "../essential/impls";
import * as formDefs from "../forms/defs";
import * as formImpls from "../forms/impls";
import * as layoutDefs from "../layout/defs";
import * as layoutImpls from "../layout/impls";
import * as navigationDefs from "../navigation/defs";
import * as navigationImpls from "../navigation/impls";
import * as overlayDefs from "../overlays/defs";
import * as overlayImpls from "../overlays/impls";

export const groups = {
  layout: { defs: layoutDefs.defs, impls: layoutImpls.impls },
  content: { defs: contentDefs.defs, impls: contentImpls.impls },
  data: { defs: dataDefs.defs, impls: dataImpls.impls },
  charts: { defs: chartDefs.defs, impls: chartImpls.impls },
  forms: { defs: formDefs.defs, impls: formImpls.impls },
  navigation: { defs: navigationDefs.defs, impls: navigationImpls.impls },
  overlays: { defs: overlayDefs.defs, impls: overlayImpls.impls },
};

export const groupDefs = Object.values(groups).flatMap((group): readonly { name: string }[] => group.defs);

// Every registry module, for the check that its array holds its named exports.
export const modules: Record<string, Record<string, unknown>> = {
  "all/defs": allDefs,
  "all/impls": allImpls,
  "essential/defs": essentialDefs,
  "essential/impls": essentialImpls,
  "layout/defs": layoutDefs,
  "layout/impls": layoutImpls,
  "content/defs": contentDefs,
  "content/impls": contentImpls,
  "data/defs": dataDefs,
  "data/impls": dataImpls,
  "charts/defs": chartDefs,
  "charts/impls": chartImpls,
  "forms/defs": formDefs,
  "forms/impls": formImpls,
  "navigation/defs": navigationDefs,
  "navigation/impls": navigationImpls,
  "overlays/defs": overlayDefs,
  "overlays/impls": overlayImpls,
};
