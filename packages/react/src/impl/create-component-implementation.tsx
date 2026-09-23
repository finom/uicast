import { memo, type ReactElement, type ReactNode } from "react";
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
import { refusePromise } from "../refuse-promise";
import { attachEngine } from "./engine";
import { runCallbackSteps } from "./run-callback-steps";

// The impl passes the schema INPUT; the steps see the OUTPUT.
type CallbackFn<S extends CombinedSpec> = [StandardSchemaV1.InferInput<S>] extends [null]
  ? () => Promise<void>
  : (args: StandardSchemaV1.InferInput<S>) => Promise<void>;

type CallbacksToFunctions<T extends Record<string, CombinedSpec>> = {
  [K in keyof T]: CallbackFn<T[K]>;
};

const describeIssues = (issues: readonly StandardSchemaV1.Issue[]): string =>
  issues
    .map((issue) => {
      const path = issue.path
        ?.map((segment) => (typeof segment === "object" ? segment.key : segment))
        .join(".");
      return path ? `${path}: ${issue.message}` : issue.message;
    })
    .join("; ");

// An async or throwing validator passes the value through: a sync render cannot await.
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
  ) => ReactElement;
  placeholder?: (props: PlaceholderComponentProps) => ReactElement;
}): ComponentImplementation<TProps, TCallbacks> => {
  // `render` may call hooks, so it runs inside a component of its own.
  const Render = memo(({ __context, ...props }: Record<string, unknown> & { __context: RenderContext }) =>
    render(props as Parameters<typeof render>[0], __context),
  );

  // Computed once per component; a component with no URL prop never runs the value walk.
  let urlSchema: JSONSchema | null | undefined;
  let hasUrlProps = false;
  const ensureUrlSchema = (): void => {
    if (urlSchema !== undefined) return;
    try {
      urlSchema = specToJSONSchema(def.props);
    } catch {
      // A spec that cannot convert fails loudly in the prompt builder; here it means no URL checking.
      urlSchema = null;
    }
    hasUrlProps = schemaHasUrlFormat(urlSchema ?? undefined);
  };

  // The parsed output has every `.default()` applied; a schema failure is a document fault.
  const evaluateProps = (
    entry: ComponentEntry,
    scopes: Scopes,
    evaluator: ExpressionEvaluator,
    urlPolicy: UrlPolicy | undefined,
  ): StandardSchemaV1.InferOutput<TProps> => {
    const rawProps = entry.props
      ? evaluate(entry.props, { scopes }, evaluator)
      : {};
    refusePromise(rawProps, "props", entry.key);
    const parsed = parseSpec(def.props, rawProps);
    if (!parsed.ok) {
      throw new EntryError(
        `Props do not match the ${def.name} schema — ${parsed.message}`,
        { reason: "invalid-props", elementKey: entry.key },
      );
    }
    const props = parsed.value as StandardSchemaV1.InferOutput<TProps>;
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

  const evaluateFlag = (
    entry: ComponentEntry,
    flag: "hidden" | "loading",
    scopes: Scopes,
    evaluator: ExpressionEvaluator,
  ): unknown => {
    const expr = entry[flag];
    const value = expr ? evaluate({ expr }, { scopes }, evaluator) : false;
    refusePromise(value, flag, entry.key);
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
    const entryCallbacks = entry.callbacks ?? {};
    // Every declared callback is callable, wired or not: `onFocus()` must not blow up because the document had no use for it.
    return Object.fromEntries(
      Object.entries(def.callbacks ?? {}).map(([key, payloadSpec]) => [
        key,
        async (evt: unknown) => {
          if (!entryCallbacks[key]) return;
          try {
            // The payload comes from the implementation, so a mismatch is an implementation bug.
            // A payload-free handler passes `undefined` where the schema says `null`.
            let attempt = parseSpec(payloadSpec, evt);
            if (!attempt.ok && evt === undefined) attempt = parseSpec(payloadSpec, null);
            if (!attempt.ok) {
              throw new EntryError(
                `Callback "${key}" on ${def.name} was given a payload its schema rejects — ${attempt.message}`,
                { reason: "implementation", elementKey: entry.key },
              );
            }
            await runCallbackSteps({
              steps: entryCallbacks[key],
              payload: attempt.value,
              scopes,
              confirm,
              evaluator,
              elementKey: entry.key,
              callbackName: key,
              debouncers,
            });
          } catch (err) {
            // Callbacks do not render, so there is no error slot: onError is the channel.
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
  };

  const impl: ComponentImplementation<TProps, TCallbacks> = { def, placeholder: placeholder ?? null };
  attachEngine(impl, {
    Render,
    evaluate: (entry, scopes, evaluator, urlPolicy) => ({
      props: evaluateProps(entry, scopes, evaluator, urlPolicy),
      hidden: evaluateFlag(entry, "hidden", scopes, evaluator),
      loading: evaluateFlag(entry, "loading", scopes, evaluator),
    }),
    callbacks: buildCallbacks,
  });
  return impl;
};
