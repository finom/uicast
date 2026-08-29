// uicast public API. Prompt-partial builders live in uicast/prompt.

export { createComponentDefinition, NO_PROPS } from "./def/create-component-definition";

export { evaluate } from "./expr/evaluate";
export { extractDeps } from "./expr/extract-deps";
export { planStepWaves } from "./expr/plan-step-waves";

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
