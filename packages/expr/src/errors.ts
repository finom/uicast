/** Why an expression was rejected. Callers map these onto their own faults. */
export type ExpressionErrorReason =
	/** Did not parse, or parsed as something other than one expression. */
	| "expression-syntax"
	/** Parsed, but uses a construct or a member the grammar does not allow. */
	| "guardrail-violation"
	/** Named something that was never handed in. */
	| "unknown-reference"
	/** Ran too long, too many steps, or allocated past a cap. */
	| "budget-exceeded"
	/** A host function's input schema rejected the argument the expression passed. */
	| "invalid-arguments"
	/** A host function threw, or its output schema rejected what it returned. */
	| "host-function"
	/** Allowed expression, wrong values (property of `null`, malformed JSON) — an ordinary runtime failure, classified apart from a policy rejection. */
	| "runtime";

export class ExpressionError extends Error {
	// Set on the instance, not the prototype: `instanceof` is unreliable when two
	// copies of this package end up in one bundle, and it is a peer dependency.
	readonly uicastExpressionError = true;
	readonly reason: ExpressionErrorReason;

	constructor(
		message: string,
		reason: ExpressionErrorReason = "guardrail-violation",
		cause?: unknown,
	) {
		super(message, cause !== undefined ? { cause } : undefined);
		this.name = "ExpressionError";
		this.reason = reason;
	}

	/** Cross-copy-safe `instanceof`. */
	static is(err: unknown): err is ExpressionError {
		return (
			typeof err === "object" &&
			err !== null &&
			(err as { uicastExpressionError?: unknown }).uicastExpressionError === true
		);
	}
}
