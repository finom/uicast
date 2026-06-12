// @ui-fired/react — the React binding for the framework-agnostic
// @ui-fired/core engine. This package owns every React-specific surface:
// the `<Renderer>` component + recursive renderer, the registry context, the
// error boundary, and the confirm host (`window.confirm` by default,
// overridden by a stateless modal passed via the `components.confirm` slot —
// the shadcn one lives in `@ui-fired/catalog`).
// Agnostic symbols (the
// element model, expression eval, reactive scopes, prompt builders, the
// component-def factories) live in `@ui-fired/core` and are imported from
// there — this package never re-exports them (strict boundary).

// The contract a `components.confirm` modal implements — the only public piece
// of the confirm seam; the context + host live behind `<Renderer>`.
export type { ConfirmComponentProps } from "./components/confirm";
// Component-renderer factory — the React half of the component-pair pattern
// (`createAIComponentDef` stays in core).
export {
  type AIComponentRenderer,
  createAIComponentRenderer,
} from "./render/createAIComponentRenderer";
export { Renderer, type RendererProps } from "./render/Renderer";
export { ErrorBoundary } from "./render/ErrorBoundary";
// Host-seeding (`init`) types, surfaced by the synthetic Fragment renderer.
export type { InitContext, InitFn } from "./render/Fragment";
// Render orchestration.
export { ListRenderer, RecursiveRenderer } from "./render/RecursiveRenderer";
// Structural element store — the stable, per-key-subscribable source the
// recursive renderer reads from (replaces threading the elements map as a
// churning prop). `<Renderer>` wires this automatically; direct consumers of
// `RecursiveRenderer` must wrap it in an `ElementsStoreProvider`.
export {
  createElementsStore,
  type ElementsStore,
  ElementsStoreProvider,
  useElement,
  useElementsStore,
} from "./render/ElementsStore";
export {
  type ErrorComponentProps,
  type RendererComponents,
  type RendererRegistry,
  RendererRegistryProvider,
  type UnknownComponentProps,
  useRendererRegistry,
} from "./render/RendererRegistry";
