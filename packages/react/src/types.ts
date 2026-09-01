import type { ReactElement, ReactNode } from "react";
import type {
  CombinedSpec,
  ComponentDefinition,
  ComponentEntry,
  EntryError,
  ReactiveProxy,
  UrlPolicy,
} from "@uicast/core";
import type { EvaluatorMode } from "@uicast/core/internal";
import type { StandardToolV0 } from "standard-tool";

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
    scopes: Scopes;
  }) => ReactElement;
  placeholder: ((props: PlaceholderComponentProps) => ReactElement) | null;
};

// The `placeholder` slot's reason: `"streaming"` (entry not arrived) or
// `"seeding"` (async seed/init still resolving). Ignorable.
export type PlaceholderComponentProps = {
  reason: "streaming" | "seeding";
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

// The `error` slot: every failure is a classified EntryError — switch on
// `reason`/`fault`. `elementKey` is set when engine-rendered.
export type ErrorComponentProps = {
  error: EntryError;
  elementKey?: string;
};

// Engine fallback UI, distinct from `implementations`. `confirm` omitted →
// `window.confirm`; shadcn versions live in the catalog.
export type FallbackComponents = {
  placeholder?: (props: PlaceholderComponentProps) => ReactElement | null;
  confirm?: (props: ConfirmComponentProps) => ReactElement | null;
  error?: (props: ErrorComponentProps) => ReactElement | null;
};

export type RendererRegistry = {
  implementations: Record<string, ComponentImplementation>;
  fallbackComponents?: FallbackComponents;
  // Host callables exposed as bare identifiers to every evaluate() under this provider.
  functions?: StandardToolV0[];
  // Which expression back end runs documents under this provider.
  evaluator?: EvaluatorMode;
  /** Longest accepted expression source, in characters. Default 1000. */
  maxExpressionLength?: number;
  // Which URLs may reach a prop the definition declares as a URL.
  urlPolicy?: UrlPolicy;
  // Reported for every classified failure (boundary catches and callback
  // failures alike) — the RendererProvider's `onError` prop.
  onError?: (error: EntryError) => void;
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

// Everything the host wires up once, for every <EntriesRenderer> in the group.
export type RendererProviderProps = {
  /** Pass a stable reference — a fresh array re-renders every node. Duplicate names throw. */
  implementations: ComponentImplementation[];
  /**
   * The engine's own fallback UI — placeholder, confirm, and error slots (see
   * `FallbackComponents`). Omitted slots use the built-in defaults.
   */
  fallbackComponents?: FallbackComponents;
  /**
   * Host functions exposed as bare identifiers in every evaluate() call
   * (callbacks invoke them as `name(input)`). Pass a stable reference.
   */
  functions?: StandardToolV0[];
  /** Expression back end: `"interpret"` (default, no `unsafe-eval`) or `"native"` (trusted authors only). */
  evaluator?: EvaluatorMode;
  /** Longest accepted expression source, in characters. Default 1000. */
  maxExpressionLength?: number;
  /** URLs allowed in def-declared URL props. Default: relative, same-origin, raster `data:`. Widen with `{ hosts }` or a predicate. */
  urlPolicy?: UrlPolicy;
  /** Called per classified failure. `fault: "document"` = model output (recoverable); `"environment"` = host code. */
  onError?: (error: EntryError) => void;
  /** One-shot per group, before the first renderer's entries evaluate. Seeds `scopes.root.*`; may attach extra named scopes (`scopes.userCtx = createProxyScope(...)`). A returned Promise suspends. */
  init?: InitFn;
};

export type EntriesRendererProps = {
  /** The JSONLines entries to render, in tree order. */
  entries: ComponentEntry[];
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
