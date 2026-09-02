// uicast public API. Prompt-partial builders live in @uicast/core/prompt;
// binding plumbing (no semver guarantee) in @uicast/core/internal.

export { createComponentDefinition } from "./def/create-component-definition";

export {
  EntryError,
  type EntryErrorReason,
  type EntryFault,
} from "./entry-error";

export { createProxyScope, type ReactiveProxy } from "./scope/create-proxy-scope";

export { buildElementsByKey } from "./utils/build-elements-by-key";

export {
  checkUrl,
  findUrlViolations,
  schemaHasUrlFormat,
  type UrlCheck,
  type UrlPolicy,
  type UrlViolation,
} from "./security/url-policy";

export { streamJsonLines } from "./stream/stream-json-lines";

export {
  type ComponentEntry,
  type ComponentListEntry,
  type ComponentDefinition,
  type CombinedSpec,
  type ValueSource,
  type ValueSourceAssignment,
  type ConfirmableValueSourceAssignment,
  isComponentEntry,
  isComponentListEntry,
} from "./types";
// The interface both evaluators implement, from @uicast/expr — here so a binding needs no expr import.
export type { ExpressionEvaluator } from "@uicast/expr";
