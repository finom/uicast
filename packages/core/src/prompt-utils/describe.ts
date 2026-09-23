import type { JSONSchema } from "./json-schema-to-ts";

// The prompt's convention: a type, then ` — description`.
export const dashTail = (description: string | undefined): string =>
	description ? ` — ${description}` : "";

// Drops one pair of parentheses around the whole type: `(A & B)` → `A & B`, but `(A) | (B)` stays.
export const unwrapParens = (ts: string): string => {
	if (!ts.startsWith("(") || !ts.endsWith(")")) return ts;
	let depth = 0;
	for (let i = 0; i < ts.length - 1; i++) {
		if (ts[i] === "(") depth++;
		else if (ts[i] === ")" && --depth === 0) return ts;
	}
	return ts.slice(1, -1);
};

// The builder prints the root description and default itself.
export const stripRootAnnotations = (jsonSchema: unknown): unknown =>
	jsonSchema !== null && typeof jsonSchema === "object"
		? { ...(jsonSchema as JSONSchema), description: undefined, default: undefined }
		: jsonSchema;
