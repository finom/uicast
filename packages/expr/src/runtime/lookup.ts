import { ExpressionError } from "../errors";

// The contexts last to first, then `global` for a name none of them has.
export const lookupName = (
	name: string,
	contexts: readonly Record<string, unknown>[],
	global: (name: string) => unknown,
): unknown => {
	for (let i = contexts.length - 1; i >= 0; i--) {
		if (!Object.hasOwn(contexts[i], name)) continue;
		const value = contexts[i][name];
		// A function is never a value: it would print its source.
		if (typeof value === "function") throw new ExpressionError(`"${name}" holds a function, which cannot be read in an expression`);
		return value;
	}
	return global(name);
};

export const unknownName = (name: string): never => {
	throw new ExpressionError(`"${name}" is not available in expressions`, "unknown-reference");
};
