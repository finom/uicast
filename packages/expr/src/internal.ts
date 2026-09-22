// Shared with sibling packages, not public API — no semver guarantee, even across a patch.
// core checks its prompt against the naming screen and method tables; expr-passthrough builds on the static half.

export { DEFAULT_MAX_SOURCE_LENGTH } from "./constants/limits";
export { ALLOWED_GLOBALS } from "./constants/globals";
export { ALLOWED_METHOD_NAMES, NAMESPACE_METHOD_NAMES } from "./constants/methods";
export { hostFunctionNameFault } from "./host/names";
export { bindTools } from "./host/tool";
export { assertData } from "./runtime/membrane";
export type { HostFunction } from "./runtime/values";
export { type Analysis, Analyzer } from "./syntax/analyzer";
export { childNodes } from "./syntax/ast";
export { parseExpression } from "./syntax/parse";
export { writtenName } from "./syntax/validate";
