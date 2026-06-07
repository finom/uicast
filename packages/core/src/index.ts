// @ui-fired/core — the framework-agnostic engine. Everything exported here is
// pure TypeScript with zero React (or any UI-framework) dependency: the element
// model + expression carriers, the sandboxed expression evaluator, the reactive
// Proxy scope store, the prompt-partial builders, and the component-definition
// factories. The React bindings (the `<Renderer>`, the recursive renderer, the
// registry context, confirm/edit-mode UI) live in the separate `@ui-fired/react`
// package; the catalog event-payload helpers (`onClickSchema`/`pickClick`) live
// in `@ui-fired/catalog`.

// Expression evaluation — sandboxed eval + auto-dep extraction.
export { evaluate, getScopeReads } from "./eval/evaluate";
export { extractDeps } from "./eval/extractDeps";
export { SafeEval, SafeEvalError } from "./eval/SafeEval";
// Utilities.
export { cn } from "./lib/utils";
// Prompt partials — catalog-/app-agnostic builders that a consuming app
// composes into a full system prompt. core no longer ships an assembler itself;
// each app owns its own assembly, joining these partials into each request's
// `system` message.
export { getCommonInstructionsPartialPrompt } from "./prompt/getCommonInstructionsPartialPrompt";
export { getComponentsPartialPrompt } from "./prompt/getComponentsPartialPrompt";
export { getExpressionsPartialPrompt } from "./prompt/getExpressionsPartialPrompt";
export { getFunctionsPartialPrompt } from "./prompt/getFunctionsPartialPrompt";
export { type JSONSchema, JSONSchemaToTs } from "./prompt-utils/JSONSchemaToTs";
// Component-definition factories — the partner-def half of the component-pair
// pattern. The React renderer half (`createAIComponentRenderer`) lives in
// `@ui-fired/react`.
export {
  type AIComponentDef,
  createAIComponentDef,
} from "./render/createAIComponentDef";
export { createAIComponentDefs } from "./render/createAIComponentDefs";
// Reactive state — `createProxyScope` plus the path-keyed emitter, and
// `parseScope` (splits a `scopes.X.Y` key into `[scopeName, leafPath]`).
// Independent of any render runtime; see docs/SCOPES.md.
export {
  type ChangePayload,
  createEmitter,
  createProxyScope,
  type Emitter,
  type EventHandler,
  type ReactiveProxy,
} from "./scope/createProxyScope";
export { parseScope } from "./scope/parseScope";
// `Fired` is a value-carrying namespace (it exports the `isList` guard
// alongside the `Element` / `List` types), so it's a runtime export, not a
// type-only one.
export { Fired } from "./types";
export type {
  CombinedProps,
  CombinedSpec,
  ConfirmableValueSourceAssignment,
  Expression,
  ScopePath,
  ValueSource,
  ValueSourceAssignment,
} from "./types";
export { buildElementsById } from "./utils/utils";
