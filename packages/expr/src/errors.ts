/**
 * Why an expression was refused or failed.
 *
 * @example
 * if (ExpressionError.is(err) && err.reason === "budget-exceeded") showTooSlow();
 */
export type ExpressionErrorReason =
  // Did not parse, or parsed as something other than one expression.
  | "expression-syntax"
  // Parsed, but uses a construct or a member the grammar does not allow.
  | "guardrail-violation"
  // Named something that was never handed in.
  | "unknown-reference"
  // Ran too long, too many steps, or allocated past a cap.
  | "budget-exceeded"
  // A host function's input schema rejected the argument the expression passed.
  | "invalid-arguments"
  // A host function threw, or its output schema rejected what it returned.
  | "host-function"
  // Allowed expression, wrong values (property of `null`, malformed JSON).
  | "expression-runtime";

export const messageOf = (err: unknown): string => (err instanceof Error ? err.message : String(err));

/**
 * Every refusal and failure of an expression, with a `reason`.
 *
 * @example
 * try {
 *   evaluator.eval("fetch('/x')");
 * } catch (err) {
 *   if (ExpressionError.is(err)) console.warn(err.reason); // "unknown-reference"
 * }
 */
export class ExpressionError extends Error {
  /** Brand for `ExpressionError.is`: `instanceof` fails when two copies of this package share a bundle. */
  readonly uicastExpressionError = true;
  /** Why it was refused or failed, e.g. `"guardrail-violation"`. */
  readonly reason: ExpressionErrorReason;

  /** `reason` defaults to `"guardrail-violation"`; `cause` becomes the error's `cause`. */
  constructor(message: string, reason: ExpressionErrorReason = "guardrail-violation", cause?: unknown) {
    super(message, cause !== undefined ? { cause } : undefined);
    this.name = "ExpressionError";
    this.reason = reason;
  }

  /**
   * Whether `err` is an `ExpressionError`, from any copy of this package. Use it over `instanceof`.
   *
   * @example
   * if (ExpressionError.is(err) && err.reason === "unknown-reference") console.warn(err.message);
   */
  static is(err: unknown): err is ExpressionError {
    return (
      typeof err === "object" &&
      err !== null &&
      (err as { uicastExpressionError?: unknown }).uicastExpressionError === true
    );
  }
}
