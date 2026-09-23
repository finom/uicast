import { describe, expect, it } from "vitest";
import { Evaluator, ExpressionError, type StandardToolV0 } from "@uicast/expr";
import { CORPUS, SCOPES } from "../../../expr/src/test/corpus";
import { PassthroughEvaluator } from "../index";

// The passthrough residual is pinned here, exactly as the README states it.

const interpret = new Evaluator();
const passthrough = new PassthroughEvaluator();
const CONTEXT = { scopes: SCOPES };

const plainJs = (expr: string): unknown => new Function("scopes", `"use strict"; return (${expr})`)(CONTEXT.scopes);

const refuses = (ev: Evaluator | PassthroughEvaluator, expr: string, context: Record<string, unknown> = {}) => {
	try {
		ev.eval(expr, context);
		return false;
	} catch (err) {
		return ExpressionError.is(err);
	}
};

describe("both agree with plain JavaScript on the corpus", () => {
	for (const expr of CORPUS) {
		it(expr, () => {
			const expected = plainJs(expr);
			expect(interpret.eval(expr, CONTEXT), "interpret").toEqual(expected);
			expect(passthrough.eval(expr, CONTEXT), "passthrough").toEqual(expected);
		});
	}
});

describe("the shared grammar is enforced by both", () => {
	const REJECTED = [
		`await 1`,
		`[3,1,2].sort()`,
		`[1,2].reverse()`,
		`"a".substr(0, 1)`,
		`"a".search("a")`,
		`[1].entries()`,
		`new Map()`,
		`[1].forEach(n => n)`,
		`[1, , 2]`,
		`(1).toLocaleString("de")`,
		`String.raw({ raw: ["a"] })`,
		`Object.assign({}, { a: 1 })`,
		`Object.freeze({})`,
		`encodeURI("a b")`,
		// no statements, so no loops and nothing to put them in
		`[1].map(() => { while (true) {} })`,
		`[1].map(() => { for (;;) {} })`,
		`[1].map(x => { let i = 0; return i })`,
		// nothing can be named, so nothing recurses
		`[1].map(function f(n) { return f(n) })`,
		`(function f(){ return f() })()`,
		`(() => 1)()`,
		// no writes
		`scopes.root.x = 1`,
		`scopes.root.x++`,
		`delete scopes.root.x`,
		`(1, 2)`,
		// no regular expressions
		`/(a+)+$/.test("aa!")`,
		`"a".replace(/a/g, "b")`,
		// escape hatches
		`eval("1+1")`,
		`arguments`,
		`import("./x.js")`,
		`String.raw\`x\``,
		`this`,
		`({}) instanceof Object`,
		`({ __proto__: { a: 1 } })`,
		// operators the language does not carry
		`"a" in ({ a: 1 })`,
		`1 & 2`,
		`1 << 2`,
		`({}).x?.()`,
		// a method is not a value
		`[].map.call`,
		`"".at.apply`,
		`[].__proto__`,
		`({}).constructor.prototype`,
		// names nobody handed in
		`fetch("/x")`,
		`globalThis`,
		`window`,
		`process`,
		`require("fs")`,
		`setTimeout(() => 1, 0)`,
		`new Function("return 1")`,
		`Function`,
		`Proxy`,
		`Reflect`,
		`RegExp`,
		`Symbol`,
		`nope()`,
		// a global that is a value, not a function; a constructor that is not
		`Date()`,
		`new Number(1)`,
		// more than five parameters, rest parameters
		`(a, b, c, d, e, f) => f`,
		`(...args) => args`,
		// syntax
		`1); (2`,
		`1 +`,
	];

	for (const expr of REJECTED) {
		it(`both refuse ${expr}`, () => {
			expect(refuses(interpret, expr, { scopes: { root: { x: 0 } } }), "interpret").toBe(true);
			expect(refuses(passthrough, expr, { scopes: { root: { x: 0 } } }), "passthrough").toBe(true);
		});
	}
});

describe("a written prototype name", () => {
	// The interpreter reads own properties only, so the name is simply absent; passthrough has no read gate and refuses the written form up front.
	for (const expr of [`({}).constructor`, `({})["constructor"]`, `({})[\`constructor\`]`, `({}).__proto__`, `[].map.bind`]) {
		it(`is nothing under interpret and refused under passthrough: ${expr}`, () => {
			try {
				expect(interpret.eval(expr)).toBeUndefined();
			} catch (err) {
				expect(ExpressionError.is(err)).toBe(true);
			}
			expect(refuses(passthrough, expr)).toBe(true);
		});
	}
});

describe("a written prototype name in a destructuring key", () => {
	it("binds nothing under interpret and is refused under passthrough", () => {
		expect(interpret.eval(`[{}].map(({ constructor: c }) => c)`)).toEqual([undefined]);
		expect(refuses(passthrough, `[{}].map(({ constructor: c }) => c)`)).toBe(true);
		expect(interpret.eval(`Object.keys({ constructor: 1 })`)).toEqual(["constructor"]);
		expect(passthrough.eval(`Object.keys({ constructor: 1 })`)).toEqual(["constructor"]);
	});
});

describe("the passthrough residual — known, documented, and deliberately not fixed", () => {
	// A name built at run time is invisible to a static check; only the interpreter checks every read.
	// Pinned: a case that stops throwing under interpret is a regression; one that starts throwing under passthrough must be understood.
	it("reaches a method beyond the list through a run-time-assembled name", () => {
		expect(refuses(interpret, `"abc"["sub" + "str"](1)`)).toBe(true);
		expect(passthrough.eval(`"abc"["sub" + "str"](1)`)).toBe("bc");
	});

	it("reaches the prototype graph through a run-time-assembled name", () => {
		expect(refuses(interpret, `Object["get" + "PrototypeOf"]([]) === Object["get" + "PrototypeOf"]([])`)).toBe(true);
		expect(passthrough.eval(`Object["get" + "PrototypeOf"]([]) === Object["get" + "PrototypeOf"]([])`)).toBe(true);
	});

	it("a prototype object that looks like data can leave under passthrough", () => {
		// Array.prototype is an array and Object.prototype has a null prototype: both pass the exit gate as empty data.
		expect(passthrough.eval(`Object["get" + "PrototypeOf"]([])`)).toBe(Array.prototype);
		expect(passthrough.eval(`[]["__pro" + "to__"]`)).toBe(Array.prototype);
		expect(refuses(interpret, `Object["get" + "PrototypeOf"]([])`)).toBe(true);
		expect(refuses(interpret, `[]["__pro" + "to__"]`)).toBe(true);
	});

	it("but a function cannot leave, in either", () => {
		for (const expr of [`({})["con" + "structor"]`, `[]["con" + "structor"]`, `[x => x]`]) {
			expect(refuses(passthrough, expr), expr).toBe(true);
			try {
				expect(interpret.eval(expr), expr).toBeUndefined();
			} catch (err) {
				expect(ExpressionError.is(err), expr).toBe(true);
			}
		}
	});

	it("does not cap allocation; the interpreter does", () => {
		expect(refuses(interpret, `"x".repeat(5000000)`)).toBe(true);
		expect((passthrough.eval(`"x".repeat(5000000)`) as string).length).toBe(5_000_000);
	});

	it("leaves Object.prototype untouched in both", () => {
		expect(Object.keys(Object.prototype)).toEqual([]);
	});
});

describe("a runtime fault is a classified ExpressionError in both", () => {
	for (const expr of [`scopes.nothing.x`, `(1).toFixed(101)`, `"a".repeat(-1)`, `JSON.parse("{")`]) {
		it(expr, () => {
			for (const ev of [interpret, passthrough]) {
				try {
					ev.eval(expr, CONTEXT);
					expect.fail(`${expr} did not throw`);
				} catch (err) {
					expect(ExpressionError.is(err), expr).toBe(true);
					expect((err as ExpressionError).reason).toBe("expression-runtime");
				}
			}
		});
	}
});

describe("host functions behave the same in both", () => {
	const tool = (name: string, execute: StandardToolV0["execute"]): StandardToolV0 => ({ name, description: "", execute });
	const functions = [
		tool("double", (input) => (input as number) * 2),
		tool("ping", () => "pong"),
		tool("hostCall", async () => 1),
	];
	const withTools = [new Evaluator({ functions }), new PassthroughEvaluator({ functions })];

	it("does not unwrap a promise that was never awaited", () => {
		for (const ev of withTools) {
			expect(ev.eval(`double(21)`)).toBe(42);
			expect(ev.eval(`hostCall(1)`)).toBeInstanceOf(Promise);
		}
	});

	it("lets a host function shadow a global of the same name", () => {
		const shadowing = [tool("Date", () => "host")];
		expect(new Evaluator({ functions: shadowing }).eval(`Date()`)).toBe("host");
		expect(new PassthroughEvaluator({ functions: shadowing }).eval(`Date()`)).toBe("host");
	});

	it("takes no arguments when the tool takes no input", () => {
		for (const ev of withTools) expect(ev.eval(`ping()`)).toBe("pong");
	});

	it("refuses more than one argument, in both", () => {
		for (const ev of withTools) {
			expect(refuses(ev, `double(1, 2)`)).toBe(true);
			expect(refuses(ev, `double(...[1])`)).toBe(true);
		}
	});

	it("refuses a host function anywhere but the callee, in both", () => {
		for (const ev of withTools) {
			for (const expr of [`double`, `[double]`, `({ g: double })`, `({ double })`, `double.name`, `double.length`, `[1].map(x => double)`]) {
				expect(refuses(ev, expr), expr).toBe(true);
			}
		}
	});

	it("allows a parenthesised callee", () => {
		for (const ev of withTools) expect(ev.eval(`(double)(21)`)).toBe(42);
	});

	it("still allows a parameter that shadows a tool name", () => {
		for (const ev of withTools) expect(ev.eval(`[1, 2].map(double => double * 2)`)).toEqual([2, 4]);
	});

	it("leaves multi-argument built-ins alone", () => {
		for (const ev of withTools) {
			expect(ev.eval(`parseInt("ff", 16)`)).toBe(255);
			expect(ev.eval(`Math.max(1, 2, 3)`)).toBe(3);
		}
	});

	it("validates input and output in both", () => {
		const schema = {
			"~standard": {
				version: 1,
				vendor: "test",
				validate: (v: unknown) => (typeof v === "number" ? { value: v } : { issues: [{ message: "want a number" }] }),
			},
		} as NonNullable<StandardToolV0["inputSchema"]>;
		const checked = [{ name: "f", description: "", inputSchema: schema, outputSchema: schema, execute: (i: unknown) => String(i) }];
		for (const ev of [new Evaluator({ functions: checked }), new PassthroughEvaluator({ functions: checked })]) {
			expect(() => ev.eval(`f("x")`)).toThrow(expect.objectContaining({ reason: "invalid-arguments" }));
			expect(() => ev.eval(`f(1)`)).toThrow(expect.objectContaining({ reason: "host-function" }));
		}
	});
});
