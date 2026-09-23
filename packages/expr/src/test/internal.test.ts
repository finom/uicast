import { describe, expect, it } from "vitest";
import { hostFunctionNameFault } from "../host/names";
import { parseExpression } from "../syntax/parse";

describe("hostFunctionNameFault", () => {
	it("accepts what the parser reads as a bare identifier", () => {
		for (const name of ["foo", "$x", "_a1", "x1", "getUser", "async", "of", "get", "package", "let"]) {
			expect(hostFunctionNameFault(name), name).toBeNull();
			expect(parseExpression(name).type, name).toBe("Identifier");
		}
	});

	it("rejects a keyword, with no list of them", () => {
		for (const name of ["class", "const", "function", "typeof", "null", "true", "await", "this", "new", "default", "in"]) {
			expect(hostFunctionNameFault(name), name).not.toBeNull();
		}
	});

	it("rejects non-identifier shapes", () => {
		for (const name of ["", " foo", "foo ", "1x", "foo-bar", "a.b", "f()", "x) || (y", "\u00e9"]) {
			expect(hostFunctionNameFault(name), name).not.toBeNull();
		}
	});
});
