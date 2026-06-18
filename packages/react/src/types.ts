import type { ReactElement, ReactNode } from "react";
import type {
  CombinedSpec,
  ComponentDefinition,
  ComponentEntry,
  ReactiveProxy,
} from "@ui-fired/core";
import type { StandardTool } from "standard-tool";

// A component's React implementation: its `def` (what the LLM reads) plus the
// mounted `render` and an optional `placeholder`.
export type ComponentImplementation<
  TProps extends CombinedSpec = CombinedSpec,
  TCallbacks extends Record<string, CombinedSpec> = Record<string, CombinedSpec>,
> = {
  def: ComponentDefinition<TProps, TCallbacks>;
  render: (props: {
    entry: ComponentEntry;
    children: ReactNode;
    scopes: Record<string, any>;
  }) => ReactElement;
  placeholder: (() => ReactElement) | null;
};

// The host confirm modal's contract. The engine keeps it mounted and drives it
// like a controlled dialog: `open` flips while a confirm is pending, `message`
// holds its last value so a closing dialog doesn't blank mid-animation.
export type ConfirmComponentProps = {
  open: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
};

// The `unknown` slot: the element's `component` name had no catalog match.
export type UnknownComponentProps = {
  componentName: string;
  elementKey: string;
};

// The `error` slot. `elementKey` is set when the engine renders the slot for a
// specific element; a standalone <ErrorBoundary> leaves it unset.
export type ErrorComponentProps = {
  error: Error;
  elementKey?: string;
};

// Host overrides for the engine's own fallback UI, passed via
// `<Renderer overrides={...}>` — distinct from the catalog `implementations`.
// `confirm` omitted falls back to `window.confirm`; the `unknown`/`error`
// defaults are bare inline-styled divs (shadcn versions in @ui-fired/shadcn-catalog).
export type RendererOverrides = {
  placeholder?: () => ReactElement | null;
  confirm?: (props: ConfirmComponentProps) => ReactElement | null;
  unknown?: (props: UnknownComponentProps) => ReactElement | null;
  error?: (props: ErrorComponentProps) => ReactElement | null;
};

export type RendererRegistry = {
  implementations: Record<string, ComponentImplementation>;
  overrides?: RendererOverrides;
  // Host callables exposed as bare identifiers to every evaluate() under this provider.
  functions?: StandardTool[];
};

// The reactive scopes threaded through the render tree: `root` plus one entry
// per active list `as` name.
export type Scopes = Record<string, ReactiveProxy>;

// Passed to the consumer's `init` callback. `scopes` is the live Proxy tree —
// assigning `scopes.root.x = …` emits the same change events a `defaults` $set
// would, so observers re-render.
export type InitContext = {
  scopes: Scopes;
};

// Runs once on mount, before any root entry renders. Sync writes land
// immediately; a returned Promise suspends the wrapper until it resolves.
export type InitFn = (ctx: InitContext) => unknown | Promise<unknown>;

export type RendererProps = {
  /**
   * The component implementations. Pass a stable reference — it feeds the
   * registry context, so a fresh array each render re-renders every node.
   * Duplicate names: the later one wins (`[...base, Override]`) and logs.
   */
  implementations: ComponentImplementation[];
  lines: ComponentEntry[];
  /**
   * Host functions exposed as bare identifiers in every evaluate() call
   * (callbacks invoke them as `name(input)`). Pass a stable reference.
   */
  functions?: StandardTool[];
  /**
   * One-shot side-effect run on mount, before any root entry evaluates. May seed
   * `scopes.root.*`; a returned Promise suspends children until it resolves.
   */
  init?: InitFn;
  /** Host overrides for the engine's own UI (see `RendererOverrides`). Pass a stable reference. */
  overrides?: RendererOverrides;
};

// The render tree's structural store: each node subscribes to its own key, so
// settled subtrees don't re-render while siblings stream in.
export interface ElementsStore {
  /** Current element for a key (stable reference until that key changes). */
  get(key: string): ComponentEntry | undefined;
  /** Subscribe to a single key. Returns an unsubscribe fn. */
  subscribe(key: string, listener: () => void): () => void;
  /** Swap in a new map, notifying only the keys whose element identity changed. */
  setMap(next: Record<string, ComponentEntry>): void;
}
