// No semver guarantee.

export { evaluate } from "./expr/evaluate";
export { extractDeps, type DepsPart } from "./expr/extract-deps";
export { planStepWaves } from "./expr/plan-step-waves";
export { parseScope } from "./scope/parse-scope";
export { createRowScope, getForwardTargets, type RowScope } from "./scope/create-proxy-scope";
export { specToJSONSchema } from "./prompt-utils/spec-to-json-schema";
export type { JSONSchema } from "./prompt-utils/json-schema-to-ts";
export { findEntrySetAddressFault, parseSetAddress, setAddressError } from "./scope/parse-set-address";
export { entryShapeError } from "./entry-shape";

export { CALLBACK_DEBOUNCE_MS } from "./constants";
export { isComponentListEntry } from "./types";
export { findUrlViolations, schemaHasUrlFormat } from "./security/url-policy";
export { noteSection } from "./prompt/note-section";
