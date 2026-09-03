import { memo, type ReactNode } from "react";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import {
  EntryError,
  type ComponentEntry,
  type CombinedSpec,
  type ComponentDefinition,
  type ExpressionEvaluator,
  type UrlPolicy,
} from "@uicast/core";
import {
  findUrlViolations,
  schemaHasUrlFormat,
  evaluate,
  specToJSONSchema,
  type JSONSchema,
} from "@uicast/core/internal";
import type {
  ComponentImplementation,
  ConfirmFn,
  Debouncers,
  PlaceholderComponentProps,
  RenderContext,
  Scopes,
} from "../types";
import { runCallbackSteps } from "./run-callback-steps";

// `null` payload = no-arg handler. The argument is the schema INPUT: the impl
// supplies it, the engine parses, the steps see the OUTPUT (defaults filled).
type CallbackFn<S extends CombinedSpec> = [StandardSchemaV1.InferInput<S>] extends [null]
  ? () => Promise<void>
  : (args: StandardSchemaV1.InferInput<S>) => Promise<void>;

type CallbacksToFunctions<T extends Record<string, CombinedSpec>> = {
  [K in keyof T]: CallbackFn<T[K]>;
};

// `issues` → one readable line: `variant: Invalid option; total: Expected number`.
const describeIssues = (issues: readonly StandardSchemaV1.Issue[]): string =>
  issues
    .map((issue) => {
      const path = issue.path
        ?.map((segment) => (typeof segment === "object" ? segment.key : segment))
        .join(".");
      return path ? `${path}: ${issue.message}` : issue.message;
    })
    .join("; ");

// Parse through a spec, return the OUTPUT (defaults applied) — what `render` and `evt` are typed as.
// An async or throwing validator passes the value through unparsed: a sync render cannot await, and both are the library's fault.
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
    props: { children?: ReactNode } & StandardSchemaV1.InferOutput<TProps> &
      CallbacksToFunctions<TCallbacks>,
    context: RenderContext,
  ) => React.ReactElement;
  placeholder?: (props: PlaceholderComponentProps) => React.ReactElement;
}): ComponentImplementation<TProps, TCallbacks> => {
  // `render` may call hooks, so it runs inside a component of its own; memo skips it when nothing it receives changed.
  const Render = memo(({ __context, ...props }: Record<string, unknown> & { __context: RenderContext }) =>
    render(props as Parameters<typeof render>[0], __context),
  );

  // Computed once per component, on first render: the props JSON Schema, and
  // whether it declares any URL at all. A component with no URL prop — almost
  // all of them — never runs the value walk.
  let urlSchema: JSONSchema | null | undefined;
  let hasUrlProps = false;
  const ensureUrlSchema = (): void => {
    if (urlSchema !== undefined) return;
    try {
      urlSchema = specToJSONSchema(def.props);
    } catch {
      // A spec that cannot convert fails loudly in the prompt builder instead;
      // here it just means no URL checking is possible.
      urlSchema = null;
    }
    hasUrlProps = schemaHasUrlFormat(urlSchema ?? undefined);
  };

  // Evaluate the entry's props, then parse them through the def's schema: the
  // result is the schema's output — every `.default()` applied — which is what
  // `render` is typed to receive. Props that fail the schema are a document
  // fault, caught here rather than as a render crash later.
  const evaluateProps = (
    entry: ComponentEntry,
    scopes: Scopes,
    evaluator: ExpressionEvaluator,
    urlPolicy: UrlPolicy | undefined,
  ): StandardSchemaV1.InferOutput<TProps> => {
    const rawProps = entry.props
      ? evaluate(entry.props, { scopes }, evaluator)
      : {};
    // The contract bans host functions (and `await`) in reactive sites: they
    // re-evaluate on every state change. Without this check the Promise would
    // leak into render as a truthy object — a silent wrong screen.
    if (rawProps instanceof Promise) {
      // Refused here, so the promise is settled by nobody — swallow its rejection.
      rawProps.catch(() => {});
      throw new EntryError(
        `"props" of ${entry.key} evaluated to a Promise — host functions and await are not allowed in props/hidden/loading/each; move the call to seed or a callback step`,
        { reason: "guardrail-violation", elementKey: entry.key },
      );
    }
    const parsed = parseSpec(def.props, rawProps);
    if (!parsed.ok) {
      throw new EntryError(
        `Props do not match the ${def.name} schema — ${parsed.message}`,
        { reason: "invalid-props", elementKey: entry.key },
      );
    }
    const props = parsed.value as StandardSchemaV1.InferOutput<TProps>;
    // Def-declared URL props are checked here, after parsing — the impl never
    // sees a URL the policy rejects.
    ensureUrlSchema();
    if (hasUrlProps) {
      const violations = findUrlViolations(urlSchema ?? undefined, props, urlPolicy);
      if (violations.length > 0) {
        const { path, url, reason } = violations[0];
        throw new EntryError(
          `Prop "${path}" of ${def.name} is a URL this renderer will not load — ${reason}. Got: ${url}`,
          { reason: "guardrail-violation", elementKey: entry.key },
        );
      }
    }
    return props;
  };

  // `hidden` and `loading`: bare expressions, false when absent.
  const evaluateFlag = (
    entry: ComponentEntry,
    flag: "hidden" | "loading",
    scopes: Scopes,
    evaluator: ExpressionEvaluator,
  ): unknown => {
    const expr = entry[flag];
    const value = expr ? evaluate({ expr }, { scopes }, evaluator) : false;
    if (value instanceof Promise) {
      // Refused here, so the promise is settled by nobody — swallow its rejection.
      value.catch(() => {});
      throw new EntryError(
        `"${flag}" of ${entry.key} evaluated to a Promise — host functions and await are not allowed in props/hidden/loading/each; move the call to seed or a callback step`,
        { reason: "guardrail-violation", elementKey: entry.key },
      );
    }
    return value;
  };

  const buildCallbacks = (
    entry: ComponentEntry,
    scopes: Scopes,
    confirm: ConfirmFn,
    evaluator: ExpressionEvaluator,
    onError: ((error: EntryError) => void) | undefined,
    debouncers: Debouncers,
  ): CallbacksToFunctions<TCallbacks> => {
    const entryCallbacks = entry.callbacks ? entry.callbacks : {};
    // Every callback the DEF declares is callable, wired or not — the def is
    // the implementation's contract, so `onFocus()` must not blow up because
    // the document had no use for it. Unwired keys resolve to a no-op.
    const handlerKeys = [
      ...new Set([...Object.keys(def.callbacks ?? {}), ...Object.keys(entryCallbacks)]),
    ];
    const callbacks = Object.fromEntries(
      handlerKeys.map((key) => [
        key,
        async (evt: unknown) => {
          if (!entryCallbacks[key]) return;
          try {
            // The payload comes from the implementation, so a mismatch is an
            // implementation bug — caught here rather than surfacing as
            // `evt.foo` quietly reading `undefined` in the model's expression.
            const payloadSpec = def.callbacks?.[key];
            let payload = evt;
            if (payloadSpec) {
              // A payload-free handler passes `undefined` where the schema
              // says `null` — retry against `null` rather than make every
              // such def write `.nullish()`.
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
            await runCallbackSteps({
              steps: entryCallbacks[key],
              payload,
              scopes,
              confirm,
              evaluator,
              elementKey: entry.key,
              callbackName: key,
              debouncers,
            });
          } catch (err) {
            // A callback failure must not vanish as an unhandled rejection.
            // Callbacks don't render, so there's no error slot — onError is
            // the channel. Later steps are skipped; written state stays.
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
    return callbacks;
  };

  return {
    def,
    Render,
    placeholder: placeholder ?? null,
    evaluate: (entry, scopes, evaluator, urlPolicy) => ({
      props: evaluateProps(entry, scopes, evaluator, urlPolicy),
      hidden: evaluateFlag(entry, "hidden", scopes, evaluator),
      loading: evaluateFlag(entry, "loading", scopes, evaluator),
    }),
    callbacks: buildCallbacks,
  };
};
