export type { ExpressionEvaluator } from "@uicast/expr";
export { buildElementsByKey } from "./build-elements-by-key";
export { createComponentDefinition } from "./create-component-definition";
export { EntryError, type EntryErrorReason, type EntryFault } from "./entry-error";
export { createProxyScope, type ReactiveProxy } from "./scope/create-proxy-scope";
export { streamJsonLines } from "./stream-json-lines";
export {
  type CallbackValueSourceAssignment,
  type CombinedSpec,
  type ComponentDefinition,
  type ComponentEntry,
  type ComponentListEntry,
  isComponentEntry,
  type ValueSource,
  type ValueSourceAssignment,
} from "./types";
export type { UrlPolicy } from "./url-policy";
