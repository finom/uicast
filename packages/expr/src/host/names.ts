import { parseExpression } from "../syntax/parse";

// ASCII only, deliberately narrower than the grammar.
const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

// The shape, then the parser's own verdict: a keyword fails without a list.
const isUsableName = (name: string): boolean => {
	if (!IDENTIFIER.test(name)) return false;
	try {
		return parseExpression(name).type === "Identifier";
	} catch {
		return false;
	}
};

// Why `name` cannot be a host function name (a message tail), or null when it can.
export const hostFunctionNameFault = (name: string): string | null =>
	isUsableName(name)
		? null
		: "is not a valid identifier — rename it (letters, digits, _ and $, not starting with a digit, not a reserved word)";
