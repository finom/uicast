import type { ReactElement, ReactNode } from "react";
import type {
  CombinedSpec,
  ComponentDefinition,
  ComponentEntry,
  EntryError,
  ReactiveProxy,
} from "@ui-fired/core";
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

// The `error` slot. Every failure arrives as a classified EntryError — switch
// on `error.reason` (or the coarse `error.fault`) to show case-specific UI; an
// unknown component name lands here too, as `reason: "unknown-component"`.
// `elementKey` is set when the engine renders the slot for a specific element;
// a standalone <ErrorBoundary> leaves it unset.
export type ErrorComponentProps = {
  error: EntryError;
  elementKey?: string;
};

// The engine's own fallback UI, shared via
// `<RendererConfigProvider defaultComponents={...}>` — distinct from the catalog
// `implementations`. `confirm` omitted falls back to `window.confirm`; the
// `error` default is a bare inline-styled div (shadcn version in
// @ui-fired/shadcn-catalog).
export type DefaultComponents = {
  placeholder?: () => ReactElement | null;
  confirm?: (props: ConfirmComponentProps) => ReactElement | null;
  error?: (props: ErrorComponentProps) => ReactElement | null;
};

export type RendererRegistry = {
  implementations: Record<string, ComponentImplementation>;
  defaultComponents?: DefaultComponents;
  // Host callables exposed as bare identifiers to every evaluate() under this provider.
  functions?: StandardToolV0[];
  // Extra globals expressions may reference, from the RendererConfigProvider.
  allowedGlobals?: string[];
  // Reported for every classified failure (boundary catches and callback
  // failures alike) — the Renderer's `onError` prop.
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

// Shared configuration for every <Renderer> beneath a <RendererConfigProvider>.
export type RendererConfig = {
  /**
   * The engine's own fallback UI — placeholder, confirm, and error slots (see
   * `DefaultComponents`). Omitted slots use the built-in defaults.
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
  functions?: StandardToolV0[];
  /**
   * One-shot side-effect run on mount, before any root entry evaluates. May seed
   * `scopes.root.*`; a returned Promise suspends children until it resolves.
   */
  init?: InitFn;
  /**
   * Called once per classified failure, with the same EntryError the error slot
   * receives. Branch on `error.fault`: `"document"` means the model's output is
   * at fault (a recovery re-emission can fix it), `"environment"` means host
   * code failed (retry or surface it — the model can't fix your server).
   */
  onError?: (error: EntryError) => void;
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
