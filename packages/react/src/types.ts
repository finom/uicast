import type { ReactElement, ReactNode } from "react";
import type {
  CombinedSpec,
  ComponentDefinition,
  ComponentEntry,
  ReactiveProxy,
} from "@ui-fired/core";
import type { StandardToolV0Definition } from "standard-tool";

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

// The engine's own fallback UI, shared via
// `<RendererConfigProvider defaultComponents={...}>` — distinct from the catalog
// `implementations`. `confirm` omitted falls back to `window.confirm`; the
// `unknown`/`error` defaults are bare inline-styled divs (shadcn versions in
// @ui-fired/shadcn-catalog).
export type DefaultComponents = {
  placeholder?: () => ReactElement | null;
  confirm?: (props: ConfirmComponentProps) => ReactElement | null;
  unknown?: (props: UnknownComponentProps) => ReactElement | null;
  error?: (props: ErrorComponentProps) => ReactElement | null;
};

export type RendererRegistry = {
  implementations: Record<string, ComponentImplementation>;
  defaultComponents?: DefaultComponents;
  // Host callables exposed as bare identifiers to every evaluate() under this provider.
  functions?: StandardToolV0Definition[];
  // Extra globals expressions may reference, from the RendererConfigProvider.
  allowedGlobals?: string[];
};

// The reactive scopes threaded through the render tree: `root` plus one entry
// per active list `as` name.
export type Scopes = Record<string, ReactiveProxy>;

// Passed to the consumer's `init` callback. `scopes` is the live Proxy tree —
// assigning `scopes.root.x = …` emits the same change events a `seed` $set
// would, so observers re-render.
export type InitContext = {
  scopes: Scopes;
};

// Runs once on mount, before any root entry renders. Sync writes land
// immediately; a returned Promise suspends the wrapper until it resolves.
export type InitFn = (ctx: InitContext) => unknown | Promise<unknown>;

// Shared configuration for every <Renderer> beneath a <RendererConfigProvider>.
export type RendererConfig = {
  /**
   * The engine's own fallback UI — placeholder, confirm, unknown, and error
   * slots (see `DefaultComponents`). Omitted slots use the built-in defaults.
   */
  defaultComponents?: DefaultComponents;
  /**
   * Extra global identifiers expressions may reference, merged onto the built-in
   * safe set (Math, JSON, Date, …). Use it to allow benign host globals the
   * default list omits — e.g. "structuredClone", "crypto". It cannot re-enable
   * the shadowed capability globals (fetch, Function, setTimeout, …); those stay
   * blocked regardless.
   */
  allowedGlobals?: string[];
};

export type RendererProps = {
  /**
   * The component implementations. Pass a stable reference — it feeds the
   * registry context, so a fresh array each render re-renders every node.
   * Duplicate names: the later one wins (`[...base, Override]`) and logs.
   */
  implementations: ComponentImplementation[];
  /** The JSONLines entries to render, in tree order. */
  entries: ComponentEntry[];
  /**
   * Host functions exposed as bare identifiers in every evaluate() call
   * (callbacks invoke them as `name(input)`). Pass a stable reference.
   */
  functions?: StandardToolV0Definition[];
  /**
   * One-shot side-effect run on mount, before any root entry evaluates. May seed
   * `scopes.root.*`; a returned Promise suspends children until it resolves.
   */
  init?: InitFn;
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
