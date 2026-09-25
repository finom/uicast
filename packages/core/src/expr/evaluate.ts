import type { ValueSource } from "../types";
import { EntryError } from "../entry-error";
import { CONTEXT_NAMES } from "../constants";
import type { ExpressionErrorReason, ExpressionEvaluator } from "@uicast/expr";
import { unwrapRows } from "../scope/create-proxy-scope";

// Identifier validity is the evaluator's own check; this screens only uicast's names.
const screened = new WeakSet<ExpressionEvaluator>();
const screen = (evaluator: ExpressionEvaluator): void => {
  if (screened.has(evaluator)) return;
  for (const { name } of evaluator.functions) {
    if (CONTEXT_NAMES.has(name)) {
      throw new EntryError(
        `Host function name "${name}" is reserved — it would shadow the expression context of the same name`,
        { reason: "host-function" },
      );
    }
  }
  screened.add(evaluator);
};

// Brand check: core has no runtime import of @uicast/expr.
const isExpressionError = (err: unknown): err is { reason: ExpressionErrorReason; cause?: unknown } =>
  typeof err === "object" &&
  err !== null &&
  (err as { uicastExpressionError?: unknown }).uicastExpressionError === true;

export const wrapEvalError = (err: unknown): EntryError => {
  if (EntryError.is(err)) return err;
  if (isExpressionError(err)) {
    // A host that classified its own failure keeps that verdict.
    if (EntryError.is(err.cause)) return err.cause;
    return EntryError.wrap(err, err.reason);
  }
  return EntryError.wrap(err, "expression-runtime");
};

export const evaluate = (
  expr: ValueSource,
  context: Record<string, unknown>,
  evaluator: ExpressionEvaluator,
): unknown => {
  if ("literal" in expr) return expr.literal;
  // An empty string falls through to the evaluator, which rejects it.
  if (expr.expr == null) return null;

  try {
    screen(evaluator);
    const source = expr.expr;
    const result = evaluator.eval(source, context);
    // Only a read of a whole scope (`scopes.row`) can put a row window in the result.
    const data = (value: unknown) =>
      evaluator.memberReads(source, "scopes").some((read) => read.indexOf(".", "scopes.".length) === -1)
        ? unwrapRows(value)
        : value;
    return result instanceof Promise
      ? result.then(data, (err) => {
          throw wrapEvalError(err);
        })
      : data(result);
  } catch (err) {
    throw wrapEvalError(err);
  }
};
