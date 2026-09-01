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
	/** Allowed expression, wrong values (property of `null`, malformed JSON) — an ordinary runtime failure, classified apart from a policy rejection. */
	| "runtime";

export class ExpressionError extends Error {
	readonly reason: ExpressionErrorReason;

	constructor(message: string, reason: ExpressionErrorReason = "guardrail-violation") {
		super(message);
		this.name = "ExpressionError";
		this.reason = reason;
	}
}
