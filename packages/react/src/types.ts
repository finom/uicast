import type { ComponentType, ReactElement, ReactNode } from "react";
import type {
  CombinedSpec,
  ComponentDefinition,
  ComponentEntry,
  EntryError,
  ExpressionEvaluator,
  ReactiveProxy,
  UrlPolicy,
} from "@uicast/core";

export type ConfirmFn = (message: string) => Promise<boolean>;

// One element's pending debounced runs, by callback name. The renderer cancels them on unmount.
export type Debouncers = Map<string, { cancel: () => void }>;

// What `render` gets besides props and callbacks.
export type RenderContext = {
  // The document line being rendered; `entry.key` is the element's key.
  entry: ComponentEntry;
  // The entry's `loading` expression, evaluated. Data components render busy while true.
  loading: boolean;
  // The scopes the entry evaluates against: root and the enclosing item scopes.
  scopes: Scopes;
};

// A component's React implementation: its `def` (what the LLM reads), the
// memoized `Render`, and what the renderer computes before calling it.
export type ComponentImplementation<
  TProps extends CombinedSpec = CombinedSpec,
  TCallbacks extends Record<string, CombinedSpec> = Record<string, CombinedSpec>,
> = {
  def: ComponentDefinition<TProps, TCallbacks>;
  // The `render` given to createComponentImplementation, memoized: same props and context, no re-render.
  Render: ComponentType<Record<string, unknown> & { __context: RenderContext }>;
  placeholder: ((props: PlaceholderComponentProps) => ReactElement) | null;
  // The entry's props parsed through the def's schema, and its `hidden`. Throws a classified EntryError on a document fault.
  evaluate: (
    entry: ComponentEntry,
    scopes: Scopes,
    evaluator: ExpressionEvaluator,
    urlPolicy: UrlPolicy | undefined,
  ) => { props: unknown; hidden: unknown; loading: unknown };
  // One handler per callback the def declares, wired or not.
  callbacks: (
    entry: ComponentEntry,
    scopes: Scopes,
    confirm: ConfirmFn,
    evaluator: ExpressionEvaluator,
    onError: ((error: EntryError) => void) | undefined,
    debouncers: Debouncers,
  ) => Record<string, (evt: unknown) => Promise<void>>;
};

// The `placeholder` slot's reason: `"streaming"` (entry not arrived) or
// `"seeding"` (async seed/init still resolving). Ignorable.
export type PlaceholderComponentProps = {
  reason: "streaming" | "seeding";
  // Absent when the placeholder fills a slot inside a real element. Present when
  // the caller draws the element itself, so the placeholder renders its own tag.
  children?: ReactNode;
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
  // Runs every expression under this provider; carries the host functions.
  evaluator: ExpressionEvaluator;
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
  // Pass a stable reference — a fresh array re-renders every node. Duplicate names throw.
  implementations: ComponentImplementation[];
  // The engine's own fallback UI — placeholder, confirm, and error slots (see
  // `FallbackComponents`). Omitted slots use the built-in defaults.
  fallbackComponents?: FallbackComponents;
  // The evaluator every document under this provider runs on, host functions bound: `new Evaluator({ functions })`, a `PassthroughEvaluator`, or your own.
  // Create it once, outside render: it holds the parse cache.
  evaluator: ExpressionEvaluator;
  // URLs allowed in def-declared URL props. Default: relative, same-origin, raster `data:`. Widen with `{ hosts }` or a predicate.
  urlPolicy?: UrlPolicy;
  // Called per classified failure. `fault: "document"` = model output (recoverable); `"environment"` = host code.
  onError?: (error: EntryError) => void;
  // One-shot per group, before the first renderer's entries evaluate. Seeds `scopes.root.*`; may attach extra named scopes (`scopes.userCtx = createProxyScope(...)`). A returned Promise suspends.
  init?: InitFn;
};

export type EntriesRendererProps = {
  // The JSONLines entries to render, in tree order.
  entries: ComponentEntry[];
};

// The render tree's structural store: each node subscribes to its own key, so
// settled subtrees don't re-render while siblings stream in.
export interface ElementsStore {
  // Current element for a key (stable reference until that key changes).
  get(key: string): ComponentEntry | undefined;
  // Subscribe to a single key. Returns an unsubscribe fn.
  subscribe(key: string, listener: () => void): () => void;
  // Swap in a new map, notifying only the keys whose element identity changed.
  setMap(next: Record<string, ComponentEntry>): void;
}
