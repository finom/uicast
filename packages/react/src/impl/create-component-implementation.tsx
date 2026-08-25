import { Activity, type ReactNode } from "react";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import {
  EntryError,
  parseScope,
  evaluate,
  planStepWaves,
  type ComponentEntry,
  type CombinedSpec,
  type ComponentDefinition,
} from "@uicast/core";
import { useConfirm } from "../providers/confirm";
import { readScopePath } from "../read-scope-path";
import { useRendererRegistry } from "../store/renderer-registry";
import type { ComponentImplementation } from "../types";

// A `null` callback payload means "no event data": the handler is a no-arg
// function (`onClick()`), not `(evt: null)`.
type CallbackFn<S extends CombinedSpec> = [StandardSchemaV1.InferOutput<S>] extends [null]
  ? () => Promise<void>
  : (args: StandardSchemaV1.InferOutput<S>) => Promise<void>;

type CallbacksToFunctions<T extends Record<string, CombinedSpec>> = {
  [K in keyof T]: CallbackFn<T[K]>;
};

export const createComponentImplementation = <
  TProps extends CombinedSpec,
  TCallbacks extends Record<string, CombinedSpec>,
>({
  def,
  render,
  placeholder,
}: {
  def: ComponentDefinition<TProps, TCallbacks>;
  render: (
    props: {
      children?: ReactNode;
      generatedKey: string;
    } & StandardSchemaV1.InferOutput<TProps> &
      CallbacksToFunctions<TCallbacks>,
  ) => React.ReactElement;
  placeholder?: () => React.ReactElement;
}): ComponentImplementation<TProps, TCallbacks> => {
  const component = (myprops: {
    entry: ComponentEntry;
    children: ReactNode;
    scopes: Record<string, any>;
  }) => {
    const { entry, children } = myprops;
    const confirm = useConfirm();
    const { functions, allowedGlobals, onError } = useRendererRegistry();
    const props: StandardSchemaV1.InferOutput<TProps> = entry.props
      ? (evaluate(
          entry.props,
          { scopes: myprops.scopes },
          { functions, allowedGlobals },
        ) as StandardSchemaV1.InferOutput<TProps>)
      : ({} as StandardSchemaV1.InferOutput<TProps>);
    const hidden = entry.hidden
      ? evaluate(
          { expr: entry.hidden },
          { scopes: myprops.scopes },
          { functions, allowedGlobals },
        )
      : false;
    const entryCallbacks = entry.callbacks ? entry.callbacks : {};
    const callbacks = Object.fromEntries(
      Object.keys(entryCallbacks).map((key) => [
        key,
        async (evt: unknown) => {
          try {
            // Pre-validate every set path — a path that doesn't parse names
            // something that doesn't exist (document fault), and failing
            // before any step runs keeps a bad path from stranding the
            // parallel steps of its wave mid-flight.
            const allSteps = entryCallbacks[key];
            const targets = new Map<(typeof allSteps)[number], [string, string]>();
            for (const setExpr of allSteps) {
              if (!setExpr.set) continue;
              try {
                targets.set(setExpr, parseScope(setExpr.set));
              } catch (err) {
                throw EntryError.wrap(err, "unknown-reference", entry.key);
              }
            }
            // Steps run in dependency waves: a step that reads a path an
            // earlier step sets waits for that write; independent steps run
            // in parallel. A `confirm` step is a barrier wave of its own —
            // and so is any step that calls a host function: a mutation's
            // effect is invisible to path analysis (the refetch after a
            // delete depends on it without reading any path it writes), so
            // effectful steps keep their order. Only pure steps parallelize.
            const callsHostFunction = (expr: string | undefined): boolean =>
              !!expr &&
              !!functions?.some((fn) =>
                new RegExp(`\\b${fn.name}\\s*\\(`).test(expr),
              );
            const waves = planStepWaves(allSteps, (step) =>
              callsHostFunction("expr" in step ? step.expr : undefined),
            );
            for (const wave of waves) {
              if (wave[0].confirm) {
                const confirmed = await confirm(wave[0].confirm);
                if (!confirmed) return;
              }
              const evaluated = wave.map((setExpr) => {
                const target = targets.get(setExpr) ?? null;
                const currentValue = target
                  ? readScopePath(myprops.scopes[target[0]], target[1])
                  : undefined;
                // Evaluate inside an async thunk: a synchronous throw becomes
                // a rejection, so allSettled observes every step and nothing
                // rejects unhandled.
                return {
                  target,
                  value: (async () =>
                    evaluate(
                      setExpr,
                      { evt, scopes: myprops.scopes, currentValue },
                      { functions, allowedGlobals },
                    ))(),
                };
              });
              // Let every step in the wave settle, apply the successful writes
              // in step order, then fail on the first rejection — so parallel
              // peers of a failed step still land, and later waves are skipped.
              const settled = await Promise.allSettled(evaluated.map((e) => e.value));
              let firstError: unknown = null;
              settled.forEach((result, i) => {
                if (result.status === "fulfilled") {
                  const { target } = evaluated[i];
                  if (target) {
                    myprops.scopes[target[0]].$set(target[1], result.value);
                  }
                } else if (firstError === null) {
                  firstError = result.reason;
                }
              });
              if (firstError !== null) throw firstError;
              await new Promise((resolve) => setTimeout(resolve, 0));
            }
          } catch (err) {
            // A callback failure (bad expression, rejecting host function)
            // must not vanish as an unhandled rejection. Steps after the
            // failed one are skipped; state already written stays. Callbacks
            // don't render, so there's no error slot — onError is the channel.
            const entryError = EntryError.wrap(err, "unknown", entry.key);
            onError?.(entryError);
            console.error(
              `[uicast] callback "${key}" on element "${entry.key}" failed:`,
              entryError,
            );
          }
        },
      ]),
    ) as CallbacksToFunctions<TCallbacks>;

    const hasReactChildren = Array.isArray(children)
      ? children.length > 0
      : Boolean(children);
    let result: React.ReactElement;
    try {
      result = render({
        ...(props as object),
        ...(hasReactChildren ? { children } : {}),
        ...callbacks,
        generatedKey: entry.key,
      });
    } catch (err) {
      if (EntryError.is(err)) throw err;
      // The render threw — decide whose fault, on the error path only: props
      // that FAIL the def's schema mean the document sent a forbidden shape;
      // props that pass mean the implementation broke on legal input. (An
      // async validator can't answer here — file it as implementation.)
      let reason: "invalid-props" | "implementation" = "implementation";
      try {
        const validation = def.props["~standard"].validate(props);
        if (!(validation instanceof Promise) && validation.issues) {
          reason = "invalid-props";
        }
      } catch {
        // A validator that itself throws can't testify either way.
      }
      throw EntryError.wrap(err, reason, entry.key);
    }

    if (entry.hidden) {
      return <Activity mode={hidden ? "hidden" : "visible"}>{result}</Activity>;
    }

    return result;
  };

  return { def, render: component, placeholder: placeholder ?? null };
};
