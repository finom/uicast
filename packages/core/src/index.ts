// @ui-fired/core public API. Prompt-partial builders live in @ui-fired/core/prompt.

export { createComponentDefinition } from "./def/create-component-definition";

export { evaluate } from "./expr/evaluate";
export { extractDeps } from "./expr/extract-deps";

export { createProxyScope } from "./scope/create-proxy-scope";
export { parseScope } from "./scope/parse-scope";

export { buildElementsById } from "./utils/utils";

export {
  type ComponentEntry,
  type ComponentDefinition,
  type CombinedSpec,
  isComponentListEntry,
} from "./types";
