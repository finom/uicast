// Shared with the sibling packages (core screens host function names with it).
// Not part of the public API: no semver guarantee — anything here may change or
// disappear on any release, including a patch.

/** Names refused as function/context keys: every reserved word plus sloppy-mode footguns (`let`, `yield`). Stricter than the parser, never looser — a test asserts that. */
export const RESERVED_WORDS: ReadonlySet<string> = new Set([
	"await", "break", "case", "catch", "class", "const", "continue", "debugger",
	"default", "delete", "do", "else", "enum", "export", "extends", "false",
	"finally", "for", "function", "if", "import", "in", "instanceof", "let",
	"new", "null", "return", "super", "switch", "this", "throw", "true", "try",
	"typeof", "var", "void", "while", "with", "yield",
]);

const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

/** Can `name` be a bare identifier in an expression? ASCII only, deliberately stricter than the grammar. */
export const isUsableName = (name: string): boolean =>
	IDENTIFIER.test(name) && !RESERVED_WORDS.has(name);

/** Longest expression source the evaluator accepts by default, in characters. The prompt tells the model the same number. */
export { DEFAULT_MAX_SOURCE_LENGTH } from "./parse";

/** The method names the grammar allows — the union, and the per-namespace tables. A host's prompt copy is checked against these so the two cannot drift. */
export { ALLOWED_METHOD_NAMES, NAMESPACE_METHOD_NAMES } from "./membrane";

/** Why `name` cannot be a host function name in an expression (message tail), or null when it can. The same screen the Evaluator's constructor runs. */
export const hostFunctionNameFault = (name: string): string | null =>
	isUsableName(name)
		? null
		: "is not a valid identifier — rename it (letters, digits, _ and $, not starting with a digit, not a reserved word)";
