import * as acorn from "acorn";
import { DEFAULT_MAX_SOURCE_LENGTH } from "../constants/limits";
import { ExpressionError } from "../errors";

// One parser for validation and evaluation. `void ( … )` forces expression context (`{…}` is an object literal)
// and turns a smuggled `)` into a rejected multi-statement parse. The newline ends a trailing `//` comment.
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
		program = acorn.parse(`void (${trimmed}\n)`, {
			ecmaVersion: 2022,
			sourceType: "script",
			// So `await x` parses and is refused by name, not as a syntax error.
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
	const unary = statement.type === "ExpressionStatement" ? statement.expression : null;
	if (unary?.type !== "UnaryExpression" || unary.operator !== "void") {
		throw new ExpressionError("Expression must be a single expression", "expression-syntax");
	}
	return unary.argument;
};
