import { describe, expect, it } from "vitest";
import { isUsableName } from "../host/names";
import { parseExpression } from "../syntax/parse";

// The screen is the parser's verdict behind an ASCII shape: a name it accepts is a name an expression can call.

describe("isUsableName", () => {
	it("accepts what the parser reads as a bare identifier", () => {
		for (const name of ["foo", "$x", "_a1", "x1", "getUser", "async", "of", "get", "package", "let"]) {
			expect(isUsableName(name), name).toBe(true);
			expect(parseExpression(name).type, name).toBe("Identifier");
		}
	});

	it("rejects a keyword, with no list of them", () => {
		for (const name of ["class", "const", "function", "typeof", "null", "true", "await", "this", "new", "default", "in"]) {
			expect(isUsableName(name), name).toBe(false);
		}
	});

	it("rejects non-identifier shapes", () => {
		for (const name of ["", " foo", "foo ", "1x", "foo-bar", "a.b", "f()", "x) || (y", "\u00e9"]) {
			expect(isUsableName(name), name).toBe(false);
		}
	});
});
