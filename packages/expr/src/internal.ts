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
