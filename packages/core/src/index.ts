// Types — the chunk-protocol shape and expression carriers consumers wire
// through the runtime.

// UI helpers shipped with core today. Slated to move out of core (see
// the OSS-prep TODO in repo docs) — consumers will thread these in via
// props/registry once that lands. Kept here for now so existing
// consumers don't break.
export { ConfirmModalProvider, useConfirm } from "./components/ConfirmModal";
export { EditModeOverlay } from "./components/EditModeOverlay";
export type { EvaluateFunctions } from "./eval/evaluate";
// Expression evaluation — sandboxed eval + auto-dep extraction.
export { evaluate, getScopeReads } from "./eval/evaluate";
export { extractDeps } from "./eval/extractDeps";
export { SafeEval, SafeEvalError } from "./eval/SafeEval";
// Utilities.
export { cn } from "./lib/utils";
// Prompt partials — catalog-/app-agnostic builders that a consuming app
// composes into a full system prompt. core no longer ships an assembler itself;
// each app owns its own assembly (e.g. neat-report joins these partials per
// endpoint to form each request's `system` message).
export { getCommonInstructionsPartialPrompt } from "./prompt/getCommonInstructionsPartialPrompt";
export { getComponentsPartialPrompt } from "./prompt/getComponentsPartialPrompt";
export { getExpressionsPartialPrompt } from "./prompt/getExpressionsPartialPrompt";
export { getFunctionsPartialPrompt } from "./prompt/getFunctionsPartialPrompt";
export { type JSONSchema, JSONSchemaToTs } from "./prompt-utils/JSONSchemaToTs";
// Component-definition / renderer factories — the pair-creation pattern.
export {
	type AIComponentDef,
	createAIComponentDef,
} from "./render/createAIComponentDef";
export { createAIComponentDefs } from "./render/createAIComponentDefs";
export {
	type AIComponentRenderer,
	createAIComponentRenderer,
} from "./render/createAIComponentRenderer";
export { createAIComponentRenderers } from "./render/createAIComponentRenderers";
// Reactive state — `createReactiveProxy` plus the path-keyed emitter.
// Independent of the chunk runtime; see docs/STATE.md.
export {
	type ChangePayload,
	createEmitter,
	createReactiveProxy,
	type Emitter,
	type EventHandler,
	type ReactiveProxy,
} from "./render/createReactiveProxy";
export { ErrorBoundary } from "./render/ErrorBoundary";
// Render orchestration.
export { ListRenderer, RecursiveRenderer } from "./render/RecursiveRenderer";
export {
	type DefaultPlaceholderComponent,
	type RendererRegistry,
	RendererRegistryProvider,
	useDefaultPlaceholder,
	useRendererRegistry,
} from "./render/RendererRegistry";
export { onClickSchema, pickClick } from "./render/shared";
export type {
	AssignableExpr,
	AssignableWithConfirmExpr,
	Chunk,
	ChunkComponent,
	ChunkComponentElement,
	ChunkComponentList,
	ChunkMeta,
	CombinedProps,
	CombinedSpec,
	ValueExpr,
} from "./types";
export { buildElementsById, parseScope } from "./utils/utils";
