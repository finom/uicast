import { describe, expect, it } from "vitest";
import { RESERVED_WORDS, isUsableName } from "../internal";
import { parseExpression } from "../parse";

// The screen may be stricter than the parser, never looser: a name it accepts
// that the parser refuses would be a host function no expression can call.

describe("isUsableName", () => {
	it("accepts only names the parser reads as a bare identifier", () => {
		for (const name of ["foo", "$x", "_a1", "x1", "getUser", "async", "of", "get", "package"]) {
			expect(isUsableName(name), name).toBe(true);
			const node = parseExpression(name);
			expect(node.type, name).toBe("Identifier");
		}
	});

	it("rejects every reserved word", () => {
		for (const name of RESERVED_WORDS) expect(isUsableName(name), name).toBe(false);
		// The hard kernel is not even a sloppy-mode identifier — the parser agrees.
		for (const name of ["class", "const", "function", "typeof", "null", "true", "await"]) {
			expect(() => {
				const node = parseExpression(name);
				if (node.type !== "Identifier") throw new Error(node.type);
			}, name).toThrow();
		}
	});

	it("rejects non-identifier shapes", () => {
		for (const name of ["", " foo", "foo ", "1x", "foo-bar", "a.b", "f()", "x) || (y", "\u00e9"]) {
			expect(isUsableName(name), name).toBe(false);
		}
	});
});
