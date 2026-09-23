export { createComponentDefinition } from "./def/create-component-definition";

export {
  EntryError,
  type EntryErrorReason,
  type EntryFault,
} from "./entry-error";

export { createProxyScope, type ReactiveProxy } from "./scope/create-proxy-scope";

export { buildElementsByKey } from "./utils/build-elements-by-key";

export type { UrlPolicy } from "./security/url-policy";

export { streamJsonLines } from "./stream/stream-json-lines";

export {
  type ComponentEntry,
  type ComponentListEntry,
  type ComponentDefinition,
  type CombinedSpec,
  type ValueSource,
  type ValueSourceAssignment,
  type CallbackValueSourceAssignment,
  isComponentEntry,
} from "./types";
export type { ExpressionEvaluator } from "@uicast/expr";
