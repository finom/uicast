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

/**
 * The second argument of an implementation's `render`.
 *
 * @example
 * createComponentImplementation({ def, render: ({ text }, { loading }) => <Button disabled={loading}>{text}</Button> });
 */
export type RenderContext = {
  /** The entry being rendered, unevaluated. */
  entry: ComponentEntry;
  /** The entry's `loading` expression, evaluated; `false` when it has none. */
  loading: boolean;
  /**
   * The scopes the entry's expressions read: `root` and, inside a list, each item's two. It is for debugging; state
   * changes go through callbacks.
   */
  scopes: Scopes;
};

/**
 * A component's React half, made by `createComponentImplementation`. `<RendererProvider>` throws on one it did not
 * make.
 *
 * @example
 * const implementations: ComponentImplementation[] = [...impls, BadgeImpl];
 */
export type ComponentImplementation<
  TProps extends CombinedSpec = CombinedSpec,
  TCallbacks extends Record<string, CombinedSpec> = Record<string, CombinedSpec>,
> = {
  /** The definition it draws. */
  def: ComponentDefinition<TProps, TCallbacks>;
  /** The `skeleton` it was made with, or `null`. */
  skeleton: ((props: SkeletonComponentProps) => ReactElement) | null;
};

/**
 * Props of a skeleton: an implementation's `skeleton`, or `fallbackComponents.defaultSkeleton`.
 *
 * @example
 * const skeleton = ({ knownProps, children }: SkeletonComponentProps<{ title?: string }>) =>
 *   children === undefined ? <Skeleton className="h-40" /> : <Card title={knownProps?.title}>{children}</Card>;
 */
export type SkeletonComponentProps<TProps = Record<string, unknown>> = {
  /** `"streaming"`: the entry has not arrived yet; `"seeding"`: its async `seed` or `init` is still resolving. */
  reason: "streaming" | "seeding";
  /** The element's own entry, or the parent's when the skeleton fills a child's slot. Nothing in it is evaluated. */
  entry: ComponentEntry;
  /**
   * Props that need no evaluation (a literal, or none), parsed and checked as `render`'s are. Absent when they come
   * from an expression or fail the checks, and in a child's slot.
   */
  knownProps?: TProps;
  /** The children's skeletons, to wrap in your own tag; `null` without children, absent in a child's slot. */
  children?: ReactNode;
};

/**
 * Props of `fallbackComponents.confirm`, the dialog a `confirm` step opens. It stays mounted; `open` toggles it.
 *
 * @example
 * const Confirm = ({ open, message, onConfirm, onCancel }: ConfirmComponentProps) => (
 *   <dialog open={open}>
 *     {message} <button onClick={onConfirm}>Yes</button> <button onClick={onCancel}>No</button>
 *   </dialog>
 * );
 */
export type ConfirmComponentProps = {
  /** Whether the dialog shows. */
  open: boolean;
  /** The step's `confirm` text. Kept while the dialog closes, so it does not blank mid-animation. */
  message: string;
  /** Runs the step and the rest. */
  onConfirm: () => void;
  /** Skips the step and every step after it. */
  onCancel: () => void;
};

/**
 * Props of `fallbackComponents.error`, drawn in place of an element that failed.
 *
 * @example
 * const RenderError = ({ error }: ErrorComponentProps) =>
 *   error.fault === "document"
 *     ? <button onClick={() => regenerate(error.elementKey)}>Regenerate</button>
 *     : <p>{error.message}</p>;
 */
export type ErrorComponentProps = {
  /** The classified failure: branch on `reason` or `fault`; `elementKey` names the element. */
  error: EntryError;
};

/**
 * The UI the renderer draws itself: skeletons, the confirm dialog and the error slot.
 *
 * @example
 * const fallbackComponents: FallbackComponents = { confirm: ConfirmModal, error: RenderError };
 */
export type FallbackComponents = {
  /** The skeleton for an implementation without its own. Omitted: nothing is drawn. */
  defaultSkeleton?: (props: SkeletonComponentProps) => ReactElement | null;
  /** The dialog a `confirm` step opens. Omitted: `window.confirm`. */
  confirm?: (props: ConfirmComponentProps) => ReactElement | null;
  /** Drawn in place of an element that failed. Omitted: a plain inline-styled `div`. */
  error?: (props: ErrorComponentProps) => ReactElement | null;
};

/**
 * The scopes an expression reads as `scopes`: `root`, the scopes `init` added, and two per enclosing list item,
 * `<as>` (the item) and `$<as>` (its row).
 *
 * @example
 * const init: InitFn = ({ scopes }) => {
 *   scopes.root.user = currentUser; // read as scopes.root.user
 *   scopes.userCtx = userCtx; // read as scopes.userCtx.name
 * };
 */
export type Scopes = { root: ReactiveProxy } & Record<string, ReactiveProxy>;

/**
 * What `init` receives.
 *
 * @example
 * const init: InitFn = ({ scopes }) => { scopes.root.theme = "dark"; };
 */
export type InitContext = {
  /** The live scopes. `scopes.root.x = …` preloads state; `scopes.userCtx = createProxyScope(…)` adds a scope. */
  scopes: Scopes;
};

/**
 * Preloads state once per provider, before the first renderer's entries evaluate. A write lands at once; a returned
 * promise suspends the group, which draws its skeleton until it resolves.
 *
 * @example
 * const init: InitFn = async ({ scopes }) => {
 *   scopes.root.user = await fetchUser();
 * };
 */
export type InitFn = (ctx: InitContext) => unknown | Promise<unknown>;

/**
 * Props of `<RendererProvider>`. Keep each value's identity stable across renders, or every element re-renders.
 *
 * @example
 * <RendererProvider implementations={impls} evaluator={evaluator} onError={report}>
 *   <EntriesRenderer entries={entries} />
 * </RendererProvider>;
 */
export type RendererProviderProps = {
  /** One per component, matching your definitions. A duplicate name throws; a new array re-renders every element. */
  implementations: ComponentImplementation[];
  /** The skeleton, confirm dialog and error slot the renderer draws itself. */
  fallbackComponents?: FallbackComponents;
  /** Runs every expression, host functions bound. Create it once, outside render: it holds the parse cache. */
  evaluator: ExpressionEvaluator;
  /** Which URLs a URL prop may hold. Default: relative, same-origin and raster `data:` URLs. */
  urlPolicy?: UrlPolicy;
  /**
   * Called once per classified failure, callback failures included. `fault: "document"` is the model's to fix;
   * `"environment"` is host code.
   */
  onError?: (error: EntryError) => void;
  /** Runs once, before the first renderer's entries evaluate. It can add named scopes; a returned promise suspends. */
  init?: InitFn;
};

/**
 * Props of `<EntriesRenderer>`.
 *
 * @example
 * const Page = ({ entries }: EntriesRendererProps) => <EntriesRenderer entries={entries} />;
 */
export type EntriesRendererProps = {
  /** The document's entries so far. Memoized on the array, so each streamed entry needs a new array. */
  entries: ComponentEntry[];
};
