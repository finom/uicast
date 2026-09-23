import { describe, expect, it } from "vitest";
import { Evaluator, ExpressionError } from "../index";

describe("what it refuses before parsing", () => {
	const ev = new Evaluator();

	it("refuses a source that is not a string", () => {
		for (const bad of [null, undefined, 42, {}, ["1"]]) {
			expect(() => ev.eval(bad as unknown as string), String(bad)).toThrow(
				expect.objectContaining({ reason: "expression-syntax" }),
			);
		}
	});

	it("refuses an empty or blank source", () => {
		for (const blank of ["", "   ", "\n\t"]) {
			expect(() => ev.eval(blank), JSON.stringify(blank)).toThrow(/cannot be empty/);
		}
	});

	it("refuses a source past maxSourceLength", () => {
		const small = new Evaluator({ maxSourceLength: 10 });
		expect(small.eval("1 + 1")).toBe(2);
		expect(() => small.eval("1 + 1 + 1 + 1 + 1")).toThrow(
			expect.objectContaining({ reason: "expression-syntax" }),
		);
	});

	it("refuses anything that is not one expression", () => {
		for (const source of ["1; 2", "const a = 1", "if (a) 1", "return 1", "a => { return 1 }"]) {
			expect(() => ev.eval(source), source).toThrow(ExpressionError);
		}
	});

	it("reads a bare object literal as an object", () => {
		expect(ev.eval("{ a: 1 }")).toEqual({ a: 1 });
		expect(ev.eval("({ a: 1 })")).toEqual({ a: 1 });
	});
});

describe("compile", () => {
	const ev = new Evaluator();

	it("runs the same expression against different contexts", () => {
		const price = ev.compile("'$' + (cents / 100).toFixed(2)");
		expect(price({ cents: 1999 })).toBe("$19.99");
		expect(price({ cents: 50 })).toBe("$0.50");
	});

	it("searches contexts right to left, like eval", () => {
		const pick = ev.compile("a");
		expect(pick({ a: 1 }, { a: 2 })).toBe(2);
		expect(pick({ a: 1 }, {})).toBe(1);
	});

	it("calls host functions bound on the evaluator", () => {
		const withTool = new Evaluator({
			functions: [{ name: "double", description: "", execute: (n) => (n as number) * 2 }],
		});
		expect(withTool.compile("double(n)")({ n: 21 })).toBe(42);
	});

	it("reports a bad expression at compile time, not at call time", () => {
		expect(() => ev.compile("({}).constructor()")).toThrow(ExpressionError);
	});

	it("defaults to no context", () => {
		expect(ev.compile("1 + 1")()).toBe(2);
	});
});

describe("the parse cache", () => {
	it("evicts past maxCacheSize without changing results", () => {
		const ev = new Evaluator({ maxCacheSize: 2 });
		expect(ev.eval("1 + 1")).toBe(2);
		expect(ev.eval("2 + 2")).toBe(4);
		expect(ev.eval("3 + 3")).toBe(6);
		expect(ev.eval("1 + 1")).toBe(2);
	});

	it("reports the same facts whether or not the entry is cached", () => {
		const ev = new Evaluator({ maxCacheSize: 1 });
		const first = ev.validate("scopes.a + scopes.b");
		ev.eval("999");
		expect(ev.validate("scopes.a + scopes.b")).toEqual(first);
	});
});
