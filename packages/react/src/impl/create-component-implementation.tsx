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
//
// The argument is the schema's INPUT: the implementation supplies the payload
// and the engine parses it, so a field with a `.default()` is the caller's to
// omit and the engine's to fill — the steps then see the parsed output.
type CallbackFn<S extends CombinedSpec> = [StandardSchemaV1.InferInput<S>] extends [null]
  ? () => Promise<void>
  : (args: StandardSchemaV1.InferInput<S>) => Promise<void>;

type CallbacksToFunctions<T extends Record<string, CombinedSpec>> = {
  [K in keyof T]: CallbackFn<T[K]>;
};

/** `issues` → one readable line: `variant: Invalid option; total: Expected number`. */
const describeIssues = (issues: readonly StandardSchemaV1.Issue[]): string =>
  issues
    .map((issue) => {
      const path = issue.path
        ?.map((segment) => (typeof segment === "object" ? segment.key : segment))
        .join(".");
      return path ? `${path}: ${issue.message}` : issue.message;
    })
    .join("; ");

/**
 * Parse a value through a spec and return its OUTPUT — the shape the schema
 * promises, defaults applied. That is what `render` and a callback's `evt` are
 * typed as (`InferOutput`), so handing over the raw input would be the engine
 * breaking its own contract.
 *
 * An async validator can't answer inside a synchronous render, so its value
 * passes through unparsed rather than blocking; the same is true of a validator
 * that throws. Both are the schema library's problem, not the document's.
 */
const parseSpec = (
  spec: CombinedSpec,
  value: unknown,
): { ok: true; value: unknown } | { ok: false; message: string } => {
  let result: ReturnType<CombinedSpec["~standard"]["validate"]>;
  try {
    result = spec["~standard"].validate(value);
  } catch {
    return { ok: true, value };
  }
  if (result instanceof Promise) return { ok: true, value };
  return result.issues
    ? { ok: false, message: describeIssues(result.issues) }
    : { ok: true, value: result.value };
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
    const { functions, allowGlobals, onError } = useRendererRegistry();
    // Evaluate the entry's props, then parse them through the def's schema:
    // the result is the schema's output — every `.default()` applied — which is
    // what `render` is typed to receive. Props that fail the schema are a
    // document fault, caught here rather than as a render crash later.
    const rawProps = entry.props
      ? evaluate(entry.props, { scopes: myprops.scopes }, { functions, allowGlobals })
      : {};
    const parsed = parseSpec(def.props, rawProps);
    if (!parsed.ok) {
      throw new EntryError(
        `Props do not match the ${def.name} schema — ${parsed.message}`,
        { reason: "invalid-props", elementKey: entry.key },
      );
    }
    const props = parsed.value as StandardSchemaV1.InferOutput<TProps>;
    const hidden = entry.hidden
      ? evaluate(
          { expr: entry.hidden },
          { scopes: myprops.scopes },
          { functions, allowGlobals },
        )
      : false;
    const entryCallbacks = entry.callbacks ? entry.callbacks : {};
    // Every callback the DEF declares is callable, whether or not this entry
    // wired it: the def is the implementation's contract, so `onFocus()` must
    // not blow up just because the document had no use for it. Keys the entry
    // wired get the step runner below; the rest resolve to a no-op. Entry keys
    // the def never declared are kept too — harmless, since no implementation
    // reads them.
    const handlerKeys = [
      ...new Set([...Object.keys(def.callbacks ?? {}), ...Object.keys(entryCallbacks)]),
    ];
    const callbacks = Object.fromEntries(
      handlerKeys.map((key) => [
        key,
        async (evt: unknown) => {
          if (!entryCallbacks[key]) return;
          try {
            // The payload comes from the implementation, not the document, so
            // a mismatch is an implementation bug — and one worth catching:
            // a missing field would otherwise surface as `evt.foo` quietly
            // reading `undefined` inside the model's expression. A `null`
            // payload declares "no event data", which is what `onPress()`
            // passes as `undefined`.
            const payloadSpec = def.callbacks?.[key];
            let payload = evt;
            if (payloadSpec) {
              // A payload-free handler is called as `onPress()`, so `evt` is
              // `undefined` where the schema says `null`. Retry once against
              // `null` rather than make every such def write `.nullish()`.
              let attempt = parseSpec(payloadSpec, evt);
              if (!attempt.ok && evt === undefined) attempt = parseSpec(payloadSpec, null);
              if (!attempt.ok) {
                throw new EntryError(
                  `Callback "${key}" on ${def.name} was given a payload its schema rejects — ${attempt.message}`,
                  { reason: "implementation", elementKey: entry.key },
                );
              }
              payload = attempt.value;
            }
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
                      { evt: payload, scopes: myprops.scopes, currentValue },
                      { functions, allowGlobals },
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
      // Props already passed the def's schema above, so a render that throws
      // here broke on input its own contract accepts — an implementation bug.
      throw EntryError.wrap(err, "implementation", entry.key);
    }

    if (entry.hidden) {
      return <Activity mode={hidden ? "hidden" : "visible"}>{result}</Activity>;
    }

    return result;
  };

  return { def, render: component, placeholder: placeholder ?? null };
};
