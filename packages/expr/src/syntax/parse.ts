import * as acorn from "acorn";
import { DEFAULT_MAX_SOURCE_LENGTH } from "../constants/limits";
import { ExpressionError, messageOf } from "../errors";

const syntaxError = (message: string) => new ExpressionError(message, "expression-syntax");

// One parser for validation and evaluation. `void ( … )` forces expression context (`{…}` is an object literal)
// and turns a smuggled `)` into a rejected multi-statement parse. The newline ends a trailing `//` comment.
export const parseExpression = (source: string, maxLength = DEFAULT_MAX_SOURCE_LENGTH): acorn.Expression => {
	if (typeof source !== "string") throw syntaxError("Expression must be a string");
	// Checked before acorn runs, so oversized input costs nothing to refuse.
	if (source.length > maxLength) {
		throw syntaxError(`Expression is too long (${source.length} characters; the limit is ${maxLength})`);
	}
	const trimmed = source.trim();
	if (!trimmed) throw syntaxError("Expression cannot be empty");

	let program: acorn.Program;
	try {
		// `allowAwaitOutsideFunction`: `await x` parses, then is refused by name.
		program = acorn.parse(`void (${trimmed}\n)`, { ecmaVersion: 2022, sourceType: "script", allowAwaitOutsideFunction: true });
	} catch (err) {
		throw syntaxError(`Syntax error: ${messageOf(err)}. Expression: ${source}`);
	}
	if (program.body.length !== 1) {
		throw syntaxError(`Expression must be a single expression, got ${program.body.length} statements`);
	}
	const [statement] = program.body;
	const unary = statement.type === "ExpressionStatement" ? statement.expression : null;
	if (unary?.type !== "UnaryExpression" || unary.operator !== "void") throw syntaxError("Expression must be a single expression");
	return unary.argument;
};

// ASCII only, deliberately narrower than the grammar.
const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

// Why `name` cannot be a host function name (a message tail), or null when it can.
// The shape, then the parser's own verdict: a keyword fails without a list.
export const hostFunctionNameFault = (name: string): string | null => {
	try {
		if (IDENTIFIER.test(name) && parseExpression(name).type === "Identifier") return null;
	} catch {}
	return "is not a valid identifier — rename it (letters, digits, _ and $, not starting with a digit, not a reserved word)";
};
