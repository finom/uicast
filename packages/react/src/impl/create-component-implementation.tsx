import {
  type CombinedSpec,
  type ComponentDefinition,
  type ComponentEntry,
  EntryError,
  type ExpressionEvaluator,
  type UrlPolicy,
} from "@uicast/core";
import {
  evaluate,
  findUrlViolations,
  type JSONSchema,
  schemaHasUrlFormat,
  specToJSONSchema,
} from "@uicast/core/internal";
import { memo, type ReactElement, type ReactNode } from "react";
import { refusePromise } from "../guards";
import type {
  ComponentImplementation,
  ConfirmFn,
  Debouncers,
  RenderContext,
  Scopes,
  SkeletonComponentProps,
} from "../types";
import { attachEngine } from "./engine";
import { runCallbackSteps } from "./run-callback-steps";

// What a schema accepts and what it parses to.
type Input<S extends CombinedSpec> = NonNullable<S["~standard"]["types"]>["input"];
type Output<S extends CombinedSpec> = NonNullable<S["~standard"]["types"]>["output"];

// The impl passes the schema INPUT; the steps see the OUTPUT.
type CallbackFn<S extends CombinedSpec> = [Input<S>] extends [null]
  ? () => Promise<void>
  : (args: Input<S>) => Promise<void>;

type CallbacksToFunctions<T extends Record<string, CombinedSpec>> = { [K in keyof T]: CallbackFn<T[K]> };

type Issue = { message: string; path?: readonly (PropertyKey | { key: PropertyKey })[] };

const describeIssues = (issues: readonly Issue[]): string =>
  issues
    .map(({ message, path }) => {
      const at = path?.map((segment) => String(typeof segment === "object" ? segment.key : segment)).join(".");
      return at ? `${at}: ${message}` : message;
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
  return result.issues ? { ok: false, message: describeIssues(result.issues) } : { ok: true, value: result.value };
};

/**
 * The React half of a component: pairs a definition with a `render` function and an optional `skeleton`. Pass the
 * result to `<RendererProvider implementations>`.
 *
 * @example
 * export const BadgeImpl = createComponentImplementation({
 *   def: BadgeDef,
 *   render: ({ text, children }) => <Badge>{children ?? text}</Badge>,
 * });
 *
 * @example
 * createComponentImplementation({
 *   def: SearchInputDef,
 *   render: ({ value, onChange }, { busy }) =>
 *     <Input value={value} disabled={busy} onChange={(e) => onChange({ value: e.target.value })} />,
 * });
 */
export const createComponentImplementation = <
  TProps extends CombinedSpec,
  TCallbacks extends Record<string, CombinedSpec>,
>({
  def,
  render,
  skeleton,
}: {
  /** The definition it draws; its schemas type `render`'s props. */
  def: ComponentDefinition<TProps, TCallbacks>;
  /**
   * Draws the element. Gets its parsed props, a function per callback and `children` in one object, and the render
   * context second. May call hooks.
   */
  render: (
    props: { children?: ReactNode } & Output<TProps> & CallbacksToFunctions<TCallbacks>,
    context: RenderContext,
  ) => ReactElement;
  /** Draws the element while a child has not arrived, or while an async `seed` or `init` resolves. */
  skeleton?: (props: SkeletonComponentProps<Output<TProps>>) => ReactElement;
}): ComponentImplementation<TProps, TCallbacks> => {
  // `render` may call hooks, so it runs inside a component of its own.
  const Render = memo(({ __context, ...props }: Record<string, unknown> & { __context: RenderContext }) =>
    render(props as Parameters<typeof render>[0], __context),
  );

  // The props schema when it declares a URL prop, else null. Computed once; a component with no URL prop never walks its values.
  let urlSchema: JSONSchema | null | undefined;
  const urlPropsSchema = (): JSONSchema | null => {
    if (urlSchema === undefined) {
      let schema: JSONSchema | undefined;
      try {
        schema = specToJSONSchema(def.props);
      } catch {
        // A spec that cannot convert fails loudly in the prompt builder; here it means no URL checking.
      }
      urlSchema = schema && schemaHasUrlFormat(schema) ? schema : null;
    }
    return urlSchema;
  };

  // The parsed output has every `.default()` applied; a schema failure is a document fault.
  const checkProps = (rawProps: unknown, entry: ComponentEntry, urlPolicy: UrlPolicy | undefined): Output<TProps> => {
    const parsed = parseSpec(def.props, rawProps);
    if (!parsed.ok) {
      throw new EntryError(`Props do not match the ${def.name} schema — ${parsed.message}`, {
        reason: "invalid-props",
        elementKey: entry.key,
      });
    }
    const props = parsed.value as Output<TProps>;
    const schema = urlPropsSchema();
    const [violation] = schema ? findUrlViolations(schema, props, urlPolicy) : [];
    if (violation) {
      throw new EntryError(
        `Prop "${violation.path}" of ${def.name} is a URL this renderer will not load — ${violation.reason}. Got: ${violation.url}`,
        { reason: "guardrail-violation", elementKey: entry.key },
      );
    }
    return props;
  };

  const evaluateProps = (
    entry: ComponentEntry,
    scopes: Scopes,
    evaluator: ExpressionEvaluator,
    urlPolicy: UrlPolicy | undefined,
  ): Output<TProps> => {
    const rawProps = entry.props ? evaluate(entry.props, { scopes }, evaluator) : {};
    refusePromise(rawProps, "props", entry.key);
    return checkProps(rawProps, entry, urlPolicy);
  };

  // A malformed `props` throws here too, and a skeleton then draws without them.
  const knownProps = (entry: ComponentEntry, urlPolicy: UrlPolicy | undefined): Record<string, unknown> | undefined => {
    try {
      const source = entry.props ?? { literal: {} };
      return "literal" in source
        ? (checkProps(source.literal, entry, urlPolicy) as Record<string, unknown>)
        : undefined;
    } catch {
      return undefined;
    }
  };

  const evaluateFlag = (
    entry: ComponentEntry,
    flag: "hidden" | "busy",
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
            console.error(`[uicast] callback "${key}" on element "${entry.key}" failed:`, entryError);
          }
        },
      ]),
    ) as CallbacksToFunctions<TCallbacks>;
  };

  // Stored without the props type, so every implementation fits one registry.
  const impl: ComponentImplementation<TProps, TCallbacks> = {
    def,
    skeleton: (skeleton ?? null) as ComponentImplementation["skeleton"],
  };
  attachEngine(impl, {
    Render,
    knownProps,
    evaluate: (entry, scopes, evaluator, urlPolicy) => ({
      props: evaluateProps(entry, scopes, evaluator, urlPolicy),
      hidden: evaluateFlag(entry, "hidden", scopes, evaluator),
      busy: evaluateFlag(entry, "busy", scopes, evaluator),
    }),
    callbacks: buildCallbacks,
  });
  return impl;
};
