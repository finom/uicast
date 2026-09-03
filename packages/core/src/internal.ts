// Internal exports for the sibling packages (the react binding) and tests.
// Not part of the public API: no semver guarantee — anything here may change
// or disappear on any release, including a patch.

export { evaluate } from "./expr/evaluate";
export { extractDeps, type DepsPart } from "./expr/extract-deps";
export { planStepWaves } from "./expr/plan-step-waves";
export { depKey, parseScope } from "./scope/parse-scope";
export {
  createRowScope,
  getForwardTargets,
  type ForwardTarget,
  type RowScope,
} from "./scope/create-proxy-scope";
export { specToJSONSchema } from "./prompt-utils/spec-to-json-schema";
export type { JSONSchema } from "./prompt-utils/json-schema-to-ts";
export {
  findEntrySetAddressFault,
  findSetAddressFault,
  parseSetAddress,
  setAddressError,
  type SetAddressFault,
} from "./scope/parse-set-address";

export { CALLBACK_DEBOUNCE_MS } from "./constants";
export { isComponentListEntry } from "./types";
export {
  checkUrl,
  findUrlViolations,
  schemaHasUrlFormat,
  type UrlCheck,
  type UrlViolation,
} from "./security/url-policy";
