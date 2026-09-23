import { ExpressionError } from "../errors";

export const lookupName = (
	name: string,
	contexts: readonly Record<string, unknown>[],
	globals: Readonly<Record<string, unknown>>,
): unknown => {
	for (let i = contexts.length - 1; i >= 0; i--) {
		if (!Object.hasOwn(contexts[i], name)) continue;
		const value = contexts[i][name];
		// A function is never a value: it would print its source.
		if (typeof value === "function") throw new ExpressionError(`"${name}" holds a function, which cannot be read in an expression`);
		return value;
	}
	if (Object.hasOwn(globals, name)) return globals[name];
	throw new ExpressionError(`"${name}" is not available in expressions`, "unknown-reference");
};
