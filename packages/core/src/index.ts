// @ui-fired/core public API — import from here, not from subpaths.

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

export { getCommonInstructionsPartialPrompt } from "./prompt/get-common-instructions-partial-prompt";
export { getComponentsPartialPrompt } from "./prompt/get-components-partial-prompt";
export { getExpressionsPartialPrompt } from "./prompt/get-expressions-partial-prompt";
export { getFunctionsPartialPrompt } from "./prompt/get-functions-partial-prompt";
