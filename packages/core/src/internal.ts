// Internal exports for the sibling packages (the react binding) and tests.
// Not part of the public API: no semver guarantee — anything here may change
// or disappear on any release, including a patch.

export { evaluate, getFreeIdentifiers } from "./expr/evaluate";
export { extractDeps, type DepsPart } from "./expr/extract-deps";
export { planStepWaves } from "./expr/plan-step-waves";
export { parseScope } from "./scope/parse-scope";
export {
  findNumericSetSegment,
  findNumericSetPath,
  numericSetPathError,
} from "./scope/validate-set-path";
