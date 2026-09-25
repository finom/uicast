import type { ReactElement, ReactNode } from "react";
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
  skeleton: ((props: SkeletonComponentProps) => ReactElement) | null;
};

// `"streaming"`: entry not arrived; `"seeding"`: async seed or init still resolving.
export type SkeletonComponentProps<TProps = Record<string, unknown>> = {
  reason: "streaming" | "seeding";
  // The element's own entry, or the parent's when the skeleton fills a child's slot. Nothing in it is evaluated.
  entry: ComponentEntry;
  // Props that need no evaluation (a literal, or none), parsed and checked as `render`'s are.
  // Absent when they come from an expression or fail the checks, and in a child's slot.
  knownProps?: TProps;
  // The children's skeletons, to wrap in your own tag; null without children, absent in a child's slot.
  children?: ReactNode;
};

// Kept mounted; `message` keeps its last value so a closing dialog does not blank mid-animation.
export type ConfirmComponentProps = {
  open: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export type ErrorComponentProps = {
  error: EntryError;
};

// `confirm` omitted: `window.confirm`.
export type FallbackComponents = {
  defaultSkeleton?: (props: SkeletonComponentProps) => ReactElement | null;
  confirm?: (props: ConfirmComponentProps) => ReactElement | null;
  error?: (props: ErrorComponentProps) => ReactElement | null;
};

// `root`, the scopes `init` attached, and one per active list `as` name.
export type Scopes = { root: ReactiveProxy } & Record<string, ReactiveProxy>;

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
