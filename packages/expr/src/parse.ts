import * as acorn from "acorn";
import { ExpressionError } from "./errors";

/** Longest accepted expression source, in characters. The real corpus tops out
 * around 140; anything near this limit belongs in a host function. */
export const DEFAULT_MAX_SOURCE_LENGTH = 1000;

// One parser for both validation and evaluation — a second parser reading a
// construct differently would be a bypass, so the class is kept nonexistent.

/** The `void ( … )` wrapper forces expression context (`{…}` is an object literal) and turns a smuggled `)` into a rejected multi-statement parse. */
export const parseExpression = (
	source: string,
	maxLength: number = DEFAULT_MAX_SOURCE_LENGTH,
): acorn.Expression => {
	if (typeof source !== "string") {
		throw new ExpressionError("Expression must be a string", "expression-syntax");
	}
	// Checked before acorn runs, so oversized input costs nothing to refuse.
	if (source.length > maxLength) {
		throw new ExpressionError(
			`Expression is too long (${source.length} characters; the limit is ${maxLength})`,
			"expression-syntax",
		);
	}
	const trimmed = source.trim();
	if (!trimmed) {
		throw new ExpressionError("Expression cannot be empty", "expression-syntax");
	}

	let program: acorn.Program;
	try {
		program = acorn.parse(`void (${trimmed})`, {
			ecmaVersion: 2022,
			sourceType: "script",
			allowAwaitOutsideFunction: true,
		});
	} catch (err) {
		throw new ExpressionError(
			`Syntax error: ${err instanceof Error ? err.message : String(err)}. Expression: ${source}`,
			"expression-syntax",
		);
	}

	if (program.body.length !== 1) {
		throw new ExpressionError(
			`Expression must be a single expression, got ${program.body.length} statements`,
			"expression-syntax",
		);
	}
	const statement = program.body[0];
	if (statement.type !== "ExpressionStatement") {
		throw new ExpressionError(
			`Expression must be a single expression, got a ${statement.type}`,
			"expression-syntax",
		);
	}
	const unary = statement.expression;
	if (unary.type !== "UnaryExpression" || unary.operator !== "void") {
		throw new ExpressionError(
			"Expression must be a single expression",
			"expression-syntax",
		);
	}
	return unary.argument;
};
