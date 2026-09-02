import type { ValueSource } from "../types";
import { EntryError, type EntryErrorReason } from "../entry-error";
import { CONTEXT_NAMES } from "./context-names";
import type { ExpressionErrorReason, ExpressionEvaluator } from "@uicast/expr";

// One seam for every expression a document evaluates: the host's evaluator runs it, and every failure comes back as a classified EntryError.
// Nothing here imports @uicast/expr at run time — an evaluator of another language needs only the interface.

// uicast's own names, refused as host-function names once per evaluator. Whether a name is a valid identifier is the language's check, at the evaluator's construction.
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

// Every `scopes.X.Y` path the expression reads.
export const getScopeReads = (expr: string, evaluator: ExpressionEvaluator): readonly string[] =>
  evaluator.memberReads(expr, "scopes");

// Total, so a reason added in @uicast/expr fails this build rather than arriving unmapped. A budget refusal is still the document asking for too much; "runtime" is a legal expression throwing.
const REASON_BY_EXPRESSION_REASON: Record<ExpressionErrorReason, EntryErrorReason> = {
  "expression-syntax": "expression-syntax",
  "guardrail-violation": "guardrail-violation",
  "unknown-reference": "unknown-reference",
  "invalid-arguments": "invalid-arguments",
  "host-function": "host-function",
  "budget-exceeded": "guardrail-violation",
  runtime: "expression-runtime",
};

// @uicast/expr's ExpressionError, known by its brand rather than its class — the same check `ExpressionError.is` makes, without importing the package.
const isExpressionError = (err: unknown): err is { reason: ExpressionErrorReason; cause?: unknown } =>
  typeof err === "object" && err !== null && (err as { uicastExpressionError?: unknown }).uicastExpressionError === true;

// Classify by provenance: the evaluator's own rejections carry their reason, an EntryError passes through, anything else threw while the expression ran.
const wrapEvalError = (err: unknown): EntryError => {
  if (EntryError.is(err)) return err;
  if (isExpressionError(err)) {
    // A host function's throw arrives wrapped, the original on `cause` — a host that classified its own failure keeps that verdict.
    if (EntryError.is(err.cause)) return err.cause;
    return EntryError.wrap(err, REASON_BY_EXPRESSION_REASON[err.reason] ?? "expression-runtime");
  }
  return EntryError.wrap(err, "expression-runtime");
};

// Evaluate a ValueSource: `literal` as-is, `expr` through the host's evaluator. An async expr resolves to a Promise (callers check `instanceof Promise`).
export const evaluate = (
  expr: ValueSource,
  context: Record<string, unknown>,
  evaluator: ExpressionEvaluator,
): unknown => {
  if ("literal" in expr) return expr.literal;
  // Absent expr means "no value"; an empty string falls through to the evaluator, which rejects it as a classified document fault.
  if (expr.expr == null) return null;

  try {
    screen(evaluator);
    const result = evaluator.eval(expr.expr, context);
    return result instanceof Promise
      ? result.catch((err) => {
          throw wrapEvalError(err);
        })
      : result;
  } catch (err) {
    throw wrapEvalError(err);
  }
};
