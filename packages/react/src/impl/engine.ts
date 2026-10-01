import type { ComponentEntry, EntryError, ExpressionEvaluator, UrlPolicy } from "@uicast/core";
import type { ComponentType } from "react";
import type { ComponentImplementation, ConfirmFn, Debouncers, RenderContext, Scopes } from "../types";

// What the renderer runs an implementation with; never on the public type.
export type ImplementationEngine = {
  // Memoized: same props and context, no re-render.
  Render: ComponentType<Record<string, unknown> & { __context: RenderContext }>;
  // Props that need no evaluation, checked as `evaluate` checks them; `undefined` when there are none to know.
  knownProps: (entry: ComponentEntry, urlPolicy: UrlPolicy | undefined) => Record<string, unknown> | undefined;
  // Throws a classified EntryError on a document fault.
  evaluate: (
    entry: ComponentEntry,
    scopes: Scopes,
    evaluator: ExpressionEvaluator,
    urlPolicy: UrlPolicy | undefined,
  ) => { props: unknown; hidden: unknown; busy: unknown };
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

// Filled only by `createComponentImplementation`.
const engines = new WeakMap<ComponentImplementation, ImplementationEngine>();

export const attachEngine = (impl: ComponentImplementation, engine: ImplementationEngine): void => {
  engines.set(impl, engine);
};

export const engineOf = (impl: ComponentImplementation): ImplementationEngine => {
  const engine = engines.get(impl);
  if (engine) return engine;
  throw new Error(
    `[uicast] The implementation of "${impl.def.name}" was not made by createComponentImplementation from this copy of @uicast/react.`,
  );
};
