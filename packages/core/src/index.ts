// @uicast/core public API. Prompt-partial builders live in @uicast/core/prompt.

export { createComponentDefinition } from "./def/create-component-definition";

export { evaluate } from "./expr/evaluate";
export { extractDeps } from "./expr/extract-deps";

export {
  EntryError,
  type EntryErrorReason,
  type EntryFault,
} from "./entry-error";

export { createProxyScope, type ReactiveProxy } from "./scope/create-proxy-scope";
export { parseScope } from "./scope/parse-scope";

export { buildElementsById } from "./utils/utils";

export { streamJsonLines } from "./stream/stream-json-lines";

export {
  type ComponentEntry,
  type ComponentListEntry,
  type ComponentDefinition,
  type CombinedSpec,
  isComponentEntry,
  isComponentListEntry,
} from "./types";
