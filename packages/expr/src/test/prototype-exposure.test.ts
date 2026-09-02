import { describe, expect, it } from "vitest";
import { Evaluator, ExpressionError } from "../index";

// Lookup tables read by key are null-prototype, so Object.prototype's members never look like entries. They did: `Math.toString` returned the real function.
const ev = new Evaluator();
const probe = (expr: string): string => {
	try {
		const r = ev.eval(expr);
		return typeof r === "function" ? "LEAKED FUNCTION" : `ALLOWED ${JSON.stringify(r)}`;
	} catch (e) {
		return ExpressionError.is(e) ? `refused (${e.reason})` : `RAW ${(e as Error).name}`;
	}
};

it("prototype members are no longer readable off a namespace", () => {
	for (const expr of [
		"Math.toString",
		"Math.valueOf",
		"Math.hasOwnProperty",
		'Math["to" + "String"]',
		"Number.toString",
		"Number.valueOf",
	]) {
		expect(probe(expr), expr).toMatch(/^refused/);
	}
	// the real members still work
	expect(ev.eval("Math.PI")).toBe(Math.PI);
	expect(ev.eval("Number.MAX_SAFE_INTEGER")).toBe(Number.MAX_SAFE_INTEGER);
});

it("toString/valueOf answer for real, no longer '[object Undefined]'", () => {
	// Once "[object Undefined]" under interpret; now implemented, so both back ends match plain JS.
	expect(ev.eval("[1, 2].toString()")).toBe("1,2");
	expect(ev.eval('"a".toString()')).toBe("a");
	expect(ev.eval("[1, 2].valueOf()")).toEqual([1, 2]);
	expect(ev.eval("(1).toString()")).toBe("1");
	expect(ev.eval("(255).toString(16)")).toBe("ff");
	// Prototype-only names the language does not implement stay refused.
	for (const expr of ['[1]["hasOwn" + "Property"](0)', "[1].isPrototypeOf([1])"]) {
		expect(probe(expr), expr).toMatch(/^refused/);
	}
});

it("a prototype name as a callee no longer throws a raw TypeError", () => {
	for (const expr of [
		"toString.trim()",
		"constructor.map(x => x)",
		"hasOwnProperty.at(0)",
		"valueOf.trim()",
	]) {
		expect(probe(expr), expr).toMatch(/^refused/);
	}
});

describe("the nested tables are null-prototype too", () => {
	it("a prototype name reached through a namespace or a Date is refused, not answered", () => {
		for (const expr of [
			'Math["to" + "String"]()',
			'JSON["to" + "String"]()',
			'Object["to" + "String"]()',
			'Array["to" + "String"]()',
			'Number["to" + "String"]()',
			'Date["to" + "String"]()',
			'new Date(0)["to" + "String"]()',
			"new Date(0).toString()",
		]) {
			expect(probe(expr), expr).not.toContain("[object");
		}
	});
});
