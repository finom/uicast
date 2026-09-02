// Internal exports for the sibling packages (the react binding) and tests.
// Not part of the public API: no semver guarantee — anything here may change
// or disappear on any release, including a patch.

export { evaluate } from "./expr/evaluate";
export { extractDeps, type DepsPart } from "./expr/extract-deps";
export { planStepWaves } from "./expr/plan-step-waves";
export { parseScope } from "./scope/parse-scope";
export { specToJSONSchema } from "./prompt-utils/spec-to-json-schema";
export type { JSONSchema } from "./prompt-utils/json-schema-to-ts";
export {
  findSetPathFault,
  findEntrySetPathFault,
  setPathError,
  type SetPathFault,
} from "./scope/validate-set-path";
