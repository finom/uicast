// @ui-fired/react — the React binding for the framework-agnostic
// @ui-fired/core engine. This package owns every React-specific surface:
// the `<Renderer>` component + recursive renderer, the registry context, the
// error boundary, and the confirm host (`window.confirm` by default,
// overridden by a stateless modal passed via the `systemVisuals.confirm` slot —
// the shadcn one lives in `@ui-fired/catalog`).
// Agnostic symbols (the element model, expression eval, reactive scopes, prompt
// builders, the component-def factories) live in `@ui-fired/core` and are
// imported from there — this package never re-exports them (strict boundary).

// Every public type lives in one place.
export type {
  ComponentImplementation,
  ConfirmComponentProps,
  UnknownComponentProps,
  ErrorComponentProps,
  RendererSystemVisuals,
  RendererRegistry,
  RendererProps,
  InitContext,
  InitFn,
  ElementsStore,
} from "./types";

// Runtime values, grouped by subsystem.
export { createComponentImplementation } from "./impl/create-component-implementation";
export { Renderer } from "./render/renderer";
export { ListRenderer, RecursiveRenderer } from "./render/recursive-renderer";
export { ErrorBoundary } from "./visuals/error-boundary";
export {
  createElementsStore,
  ElementsStoreProvider,
  useElement,
  useElementsStore,
} from "./store/elements-store";
export {
  RendererRegistryProvider,
  useRendererRegistry,
} from "./store/renderer-registry";
