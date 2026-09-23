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

// What a `confirm:` step awaits: the host modal from `fallbackComponents.confirm`, else `window.confirm`.
export type ConfirmFn = (message: string) => Promise<boolean>;

// Cancelled on unmount.
export type Debouncers = Map<string, { cancel: () => void }>;

export type RenderContext = {
  entry: ComponentEntry;
  loading: boolean;
  scopes: Scopes;
};

// Made by `createComponentImplementation`, which also gives the renderer an engine for it.
export type ComponentImplementation<
  TProps extends CombinedSpec = CombinedSpec,
  TCallbacks extends Record<string, CombinedSpec> = Record<string, CombinedSpec>,
> = {
  def: ComponentDefinition<TProps, TCallbacks>;
  placeholder: ((props: PlaceholderComponentProps) => ReactElement) | null;
};

// What the renderer runs an implementation with; not exported from the package.
export type ImplementationEngine = {
  // Memoized: same props and context, no re-render.
  Render: ComponentType<Record<string, unknown> & { __context: RenderContext }>;
  // Throws a classified EntryError on a document fault.
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

// `"streaming"`: entry not arrived; `"seeding"`: async seed or init still resolving.
export type PlaceholderComponentProps = {
  reason: "streaming" | "seeding";
  // Present when the caller draws the element itself, so the placeholder renders its own tag.
  children?: ReactNode;
};

// Kept mounted; `message` keeps its last value so a closing dialog does not blank mid-animation.
export type ConfirmComponentProps = {
  open: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
};

// `elementKey` is set when engine-rendered.
export type ErrorComponentProps = {
  error: EntryError;
  elementKey?: string;
};

// `confirm` omitted: `window.confirm`.
export type FallbackComponents = {
  placeholder?: (props: PlaceholderComponentProps) => ReactElement | null;
  confirm?: (props: ConfirmComponentProps) => ReactElement | null;
  error?: (props: ErrorComponentProps) => ReactElement | null;
};

export type RendererRegistry = {
  implementations: Record<string, ComponentImplementation>;
  fallbackComponents?: FallbackComponents;
  evaluator: ExpressionEvaluator;
  urlPolicy?: UrlPolicy;
  onError?: (error: EntryError) => void;
};

// `root`, the scopes `init` attached, and one per active list `as` name.
export type Scopes = Record<string, ReactiveProxy>;

// `scopes` is the live proxy tree: assigning `scopes.root.x = …` emits like a `seed` write.
export type InitContext = {
  scopes: Scopes;
};

// Sync writes land immediately; a returned Promise suspends the wrapper until it resolves.
export type InitFn = (ctx: InitContext) => unknown | Promise<unknown>;

export type RendererProviderProps = {
  // A fresh array re-renders every node. Duplicate names throw.
  implementations: ComponentImplementation[];
  fallbackComponents?: FallbackComponents;
  // Create it once, outside render: it holds the parse cache.
  evaluator: ExpressionEvaluator;
  // Default: relative, same-origin, raster `data:`.
  urlPolicy?: UrlPolicy;
  // `fault: "document"` is model output (recoverable); `"environment"` is host code.
  onError?: (error: EntryError) => void;
  // Once per group, before the first renderer's entries evaluate; may attach extra named scopes. A returned Promise suspends.
  init?: InitFn;
};

export type EntriesRendererProps = {
  entries: ComponentEntry[];
};

// Each node subscribes to its own key, so settled subtrees don't re-render while siblings stream in.
export interface ElementsStore {
  get(key: string): ComponentEntry | undefined;
  subscribe(key: string, listener: () => void): () => void;
  // Notifies only the keys whose element identity changed.
  setMap(next: Record<string, ComponentEntry>): void;
}
