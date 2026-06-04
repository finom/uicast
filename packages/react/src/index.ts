// @ui-fired/react — the React binding for the framework-agnostic
// @ui-fired/core engine. This package owns every React-specific surface:
// the `<Renderer>` factory + recursive renderer, the registry context, the
// error boundary, the confirm seam (a `window.confirm` default + an override
// context; the shadcn confirm modal lives in `@ui-fired/catalog`), and the
// edit-mode overlay. Agnostic symbols (the
// element model, expression eval, reactive scopes, prompt builders, the
// component-def factories) live in `@ui-fired/core` and are imported from
// there — this package never re-exports them (strict boundary).

export {
  type ConfirmFn,
  ConfirmProvider,
  useConfirm,
} from "./components/confirm";
export { EditModeOverlay } from "./components/EditModeOverlay";
// Component-renderer factories — the React half of the component-pair pattern
// (`createAIComponentDef` stays in core).
export {
  type AIComponentRenderer,
  createAIComponentRenderer,
} from "./render/createAIComponentRenderer";
export { createAIComponentRenderers } from "./render/createAIComponentRenderers";
export { ErrorBoundary } from "./render/ErrorBoundary";
// Host-seeding (`init`) types, surfaced by the synthetic Fragment renderer.
export type { InitContext, InitFn } from "./render/Fragment";
// Render orchestration.
export { ListRenderer, RecursiveRenderer } from "./render/RecursiveRenderer";
export {
  type DefaultPlaceholderComponent,
  type RendererRegistry,
  RendererRegistryProvider,
  useDefaultPlaceholder,
  useRendererRegistry,
} from "./render/RendererRegistry";
