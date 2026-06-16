// @ui-fired/react public types — the package's whole type surface in one place.
// Runtime values (factories, components, contexts, hooks) live in the subsystem
// folders (impl/ render/ store/ visuals/) and import their types from here.

import type { ReactElement, ReactNode } from "react";
import type {
  CombinedSpec,
  ComponentDefinition,
  ComponentEntry,
  createProxyScope,
} from "@ui-fired/core";
import type { StandardTool } from "standard-tool";

// A component's React implementation: its ComponentDefinition (the specs the LLM
// reads) plus the mounted `component` and an optional `placeholder`. Generic over
// the same specs as ComponentDefinition; both default to the widened form.
export type ComponentImplementation<
  TProps extends CombinedSpec = CombinedSpec,
  TCallbacks extends Record<string, CombinedSpec> = Record<string, CombinedSpec>,
> = ComponentDefinition<TProps, TCallbacks> & {
  component: (props: {
    chunk: ComponentEntry;
    children: ReactNode;
    scopes: Record<string, any>;
  }) => ReactElement;
  placeholder: (() => ReactElement) | null;
};

/**
 * The contract a host confirm modal implements. The engine keeps the component
 * mounted and drives it like a controlled dialog: `open` flips while a confirm
 * is pending, `message` keeps its last value so a closing dialog doesn't blank
 * out mid-animation, and exactly one of `onConfirm` / `onCancel` settles the
 * pending step.
 */
export type ConfirmComponentProps = {
  open: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
};

// Props for the `unknown` slot — the element's `component` name had no match
// in the catalog.
export type UnknownComponentProps = {
  componentName: string;
  elementKey: string;
};

// Props for the `error` slot. `elementKey` is present when the engine renders
// the slot for a specific element; a standalone <ErrorBoundary> leaves it
// unset.
export type ErrorComponentProps = {
  error: Error;
  elementKey?: string;
};

// Host-supplied system visuals: named overrides for the engine's own UI,
// passed in via the `<Renderer systemVisuals={...}>` prop. Distinct from
// `implementations` (the catalog component implementations) — these are the
// engine's own fallback UI. Extensible: add a field here + one resolution site
// (RecursiveRenderer for per-node visuals, `<Renderer>` for tree-level ones
// like `confirm`).
// - `placeholder` renders while a node's chunk hasn't streamed in yet (and as
//   the Suspense fallback while async defaults load); null = render nothing.
// - `confirm` is the modal that resolves callback steps carrying `confirm:`;
//   omitted → the browser-native `window.confirm`. Stateless: the engine owns
//   the pending state and drives it as a controlled dialog (see
//   `ConfirmComponentProps`).
// - `unknown` replaces an element whose `component` has no implementation in
//   the catalog.
// - `error` replaces an element whose render threw (and the not-a-list misuse
//   of a list key).
// The `unknown`/`error` defaults are bare inline-styled divs — zero CSS
// dependencies; the shadcn-styled versions ship in @ui-fired/catalog
// (`UnknownComponent`, `RenderError`) for hosts to attach manually.
export type RendererSystemVisuals = {
  placeholder?: () => ReactElement | null;
  confirm?: (props: ConfirmComponentProps) => ReactElement | null;
  unknown?: (props: UnknownComponentProps) => ReactElement | null;
  error?: (props: ErrorComponentProps) => ReactElement | null;
};

export type RendererRegistry = {
  implementations: Record<string, ComponentImplementation>;
  // Host-supplied system visuals (see `RendererSystemVisuals`).
  // Stabilised by `<Renderer>` so its identity doesn't churn this context value
  // (which would re-render every node).
  systemVisuals?: RendererSystemVisuals;
  // Host-provided callables exposed as bare identifiers inside every
  // evaluate() invocation under this provider. The wrapping <Renderer> prop
  // carries them in; every evaluate site reads them from useRendererRegistry
  // and passes them through as the third arg.
  functions?: StandardTool[];
};

/**
 * Context passed to the consumer's `init` callback. `scopes` is the live
 * reactive Proxy tree — assignments like `scopes.root.headings = X` route
 * through the Proxy's `set` trap and emit the same change events that a
 * `defaults`-driven `$set` would, so downstream chunks observing the path
 * re-render normally.
 */
export type InitContext = {
  scopes: Record<string, ReturnType<typeof createProxyScope>>;
};

/**
 * Consumer-supplied side-effect callback that runs exactly once on mount,
 * before any LLM-emitted root chunks render. Sync writes land immediately
 * (via the Proxy `set` trap). Async writes Suspend the wrapper via the
 * same `setDefaultsPromiseRef` + `use(p)` flow async string-form defaults
 * already use — children mount only after the Promise resolves.
 */
export type InitFn = (ctx: InitContext) => unknown | Promise<unknown>;

export type RendererProps = {
  /**
   * The component implementations: an array of `ComponentImplementation`.
   * `<Renderer>` builds the name→implementation lookup itself
   * (`element.component` is matched to `implementation.name`) — symmetric with
   * `functions`. Pass a STABLE reference (a module const, not a fresh array each
   * render) because it feeds the registry context, whose identity must stay
   * stable or every node re-renders. On a duplicate name the later
   * implementation wins (so `[...base, Override]` overrides) and a
   * `console.error` is logged.
   */
  implementations: ComponentImplementation[];
  lines: ComponentEntry[];
  /**
   * Host runtime functions exposed as bare identifiers in every evaluate() call
   * inside this tree (callbacks invoke them as `name(input)`). Pass a stable
   * reference, like `implementations`. `undefined` means expressions can only reference
   * built-ins + scopes.
   */
  functions?: StandardTool[];
  /**
   * One-shot side-effect run on the synthetic RootFragment wrapper's mount, before
   * any LLM-emitted root chunk evaluates its props/defaults. May seed
   * `scopes.root.*` via the reactive Proxy; if it returns a Promise the wrapper
   * Suspends until it resolves so children see the seeded state on mount.
   */
  init?: InitFn;
  /**
   * Host-supplied system visuals for the engine's own UI: `placeholder`
   * (shown while a node's chunk hasn't streamed in) and `confirm` (the modal
   * resolving callback steps that carry `confirm:`; defaults to
   * `window.confirm`). Distinct from `implementations` (the AI-renderable components).
   * Pass a stable reference, like `functions`.
   */
  systemVisuals?: RendererSystemVisuals;
};

// The structural source of truth for a render tree: each node subscribes to its
// OWN key via `useSyncExternalStore`, so settled subtrees never re-render while
// siblings stream in. Built by `createElementsStore`.
export interface ElementsStore {
  /** Current element for a key (stable reference until that key changes). */
  get(key: string): ComponentEntry | undefined;
  /** Subscribe to changes for a single key. Returns an unsubscribe fn. */
  subscribe(key: string, listener: () => void): () => void;
  /** Swap in a new map, notifying only the keys whose element identity changed. */
  setMap(next: Record<string, ComponentEntry>): void;
}
