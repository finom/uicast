import { describe, expect, it } from "vitest";
import type { StandardToolV0 } from "standard-tool";
import { Evaluator, ExpressionError } from "../index";
import { CORPUS, SCOPES } from "./corpus";

// Two back ends, two threat models. They are NOT two strengths of the same
// guarantee, and this suite is written to keep that distinction honest.
//
//   interpret — nothing trusted. Every read and call is checked at run time, so
//               a property name assembled at run time is checked too. Slower,
//               and no `unsafe-eval`.
//   native    — the document's author is trusted: the host's own generation
//               pipeline, with a production model in front of it. Validate, then
//               run the expression itself. Near-native speed, and a residual
//               that is written down below rather than papered over.
//
// What follows asserts three things: they agree on every expression the prompt
// contract allows; they both refuse everything the static grammar forbids; and
// native's residual is exactly what we say it is — no more, and no less.

const interpret = new Evaluator({ mode: "interpret" });
const native = new Evaluator({ mode: "native" });

const CONTEXT = { scopes: SCOPES };

const plainJs = (expr: string): unknown =>
	new Function("scopes", `"use strict"; return (${expr})`)(CONTEXT.scopes);

const refuses = (ev: Evaluator, expr: string, context: Record<string, unknown> = {}) => {
	try {
		ev.eval(expr, context);
		return false;
	} catch (err) {
		return err instanceof ExpressionError;
	}
};

describe("both back ends agree on the language the contract advertises", () => {
	for (const expr of CORPUS) {
		it(`${expr}`, () => {
			const expected = plainJs(expr);
			expect(interpret.eval(expr, CONTEXT), "interpret").toEqual(expected);
			expect(native.eval(expr, CONTEXT), "native").toEqual(expected);
		});
	}
});

describe("the static grammar is enforced by both", () => {
	// Everything the shared validator rejects — the parse-level guarantees, which
	// hold no matter which back end runs afterwards.
	const REJECTED = [
		`await 1`,
		`[3,1,2].sort()`,
		`[1,2].reverse()`,
		`"a".charAt(0)`,
		`"a".concat("b")`,
		`[1].concat([2])`,
		`(1).toPrecision(2)`,
		`"a".toLocaleLowerCase()`,
		`String.fromCharCode(65)`,
		`Array.of(1)`,
		`Date.parse("x")`,
		`encodeURI("a b")`,
		// no statements, so no loops and nothing to put them in
		`[1].map(() => { while (true) {} })`,
		`[1].map(() => { for (;;) {} })`,
		`[1].map(x => { let i = 0; return i })`,
		// nothing can be named, so nothing recurses
		`[1].map(function f(n) { return f(n) })`,
		`(function f(){ return f() })()`,
		// no immediately-invoked functions
		`(() => 1)()`,
		// no writes
		`scopes.root.x = 1`,
		`scopes.root.x++`,
		`delete scopes.root.x`,
		`(1, 2)`,
		// no regular expressions — ReDoS lives where no counter can see it
		`/(a+)+$/.test("aa!")`,
		`"a".replace(/a/g, "b")`,
		// escape hatches
		`eval("1+1")`,
		`arguments`,
		`import("./x.js")`,
		`String.raw\`x\``,
		`this`,
		`({}) instanceof Object`,
		// operators the language does not carry
		`"a" in ({ a: 1 })`,
		`1 & 2`,
		`1 << 2`,
		// optional calls ask about the METHOD value, which is not a value here
		`({}).x?.()`,
		// written property names that reach the prototype chain
		`({}).constructor`,
		`({})["constructor"]`,
		`[].__proto__`,
		`({}).constructor.prototype`,
		`[].map.call`,
		`"".at.apply`,
		// names nobody handed in — refused before the expression runs
		`fetch("/x")`,
		`globalThis`,
		`window`,
		`process`,
		`require("fs")`,
		`setTimeout(() => 1, 0)`,
		`new Function("return 1")`,
		`nope()`,
		// syntax
		`1); (2`,
		`1 +`,
	];

	for (const expr of REJECTED) {
		it(`both refuse ${expr}`, () => {
			expect(refuses(interpret, expr, { scopes: { root: { x: 0 } } }), "interpret").toBe(true);
			expect(refuses(native, expr, { scopes: { root: { x: 0 } } }), "native").toBe(true);
		});
	}
});

describe("native's residual — known, documented, and deliberately not fixed", () => {
	// These are the cases a static pass cannot see: the property name does not
	// exist until the expression runs. Catching them means checking every read,
	// which is the interpreter and its 6× cost.
	//
	// They are asserted rather than merely described so that the difference
	// between the two modes stays visible in CI. If one of these ever starts
	// throwing under native, something changed that should be understood — and if
	// one ever stops throwing under interpret, that is a serious regression.
	const COMPUTED_KEY_ESCAPES = [
		`({})["con" + "structor"]`,
		`({})[["con","str","uctor"].join("")]`,
		`[]["__pro" + "to__"]`,
		`Object["get" + "PrototypeOf"]([])`,
	];

	for (const expr of COMPUTED_KEY_ESCAPES) {
		it(`interpret refuses, native allows: ${expr}`, () => {
			expect(refuses(interpret, expr), "interpret must refuse").toBe(true);
			expect(refuses(native, expr), "native's documented residual").toBe(false);
		});
	}

	it("native reaches real methods through a run-time-assembled name; interpret does not", () => {
		// The WRITTEN form is grammar-checked in both modes now — only a name
		// assembled at run time slips past the static pass.
		expect(refuses(interpret, `Object.getPrototypeOf([])`)).toBe(true);
		expect(refuses(native, `Object.getPrototypeOf([])`)).toBe(true);
		expect(refuses(interpret, `Object["get" + "PrototypeOf"]([])`)).toBe(true);
		expect(native.eval(`Object["get" + "PrototypeOf"]([])`)).toBe(Array.prototype);
	});

	it("native does not cap allocation; interpret does", () => {
		expect(refuses(interpret, `"x".repeat(5000000)`)).toBe(true);
		expect((native.eval(`"x".repeat(5000000)`) as string).length).toBe(5_000_000);
	});

	it("native reaches methods beyond the list only via a computed name", () => {
		expect(refuses(interpret, `[1,2,3].findIndex(n => n > 1).toString(2)`)).toBe(false);
		expect(refuses(interpret, `"abc"["char" + "At"](0)`)).toBe(true);
		expect(native.eval(`"abc"["char" + "At"](0)`)).toBe("a");
	});

	it("still refuses the capability globals, which are shadowed as well as unlisted", () => {
		for (const expr of [`fetch`, `Function`, `Proxy`, `Reflect`, `RegExp`, `Symbol`]) {
			expect(refuses(native, expr), expr).toBe(true);
		}
	});

	it("leaves Object.prototype untouched in both", () => {
		expect(Object.keys(Object.prototype)).toEqual([]);
	});
});

describe("host functions behave the same in both", () => {
	const tool = (name: string, execute: StandardToolV0["execute"]): StandardToolV0 => ({
		name,
		description: "",
		execute,
	});
	const functions = [
		tool("getUser", async (input) => ({ id: (input as { id: number }).id, name: "Ada" })),
		tool("double", (input) => (input as number) * 2),
		tool("ping", () => "pong"),
		tool("hostCall", async () => 1),
	];
	const withTools = [
		new Evaluator({ functions }),
		new Evaluator({ mode: "native", functions }),
	];

	it("does not unwrap a promise that was never awaited", () => {
		for (const ev of withTools) {
			expect(ev.eval(`double(21)`)).toBe(42);
			expect(ev.eval(`hostCall(1)`)).toBeInstanceOf(Promise);
		}
	});

	it("lets a host function shadow a global of the same name", () => {
		const shadowing = [tool("Date", () => "host")];
		for (const mode of ["interpret", "native"] as const) {
			expect(new Evaluator({ mode, functions: shadowing }).eval(`Date()`)).toBe("host");
		}
	});

	it("takes no arguments when the tool takes no input", () => {
		for (const ev of withTools) expect(ev.eval(`ping()`)).toBe("pong");
	});

	// The two back ends used to disagree here: interpret dropped the extra
	// argument, native passed it through.
	it("refuses more than one argument, in both", () => {
		for (const ev of withTools) {
			expect(refuses(ev, `double(1, 2)`)).toBe(true);
			expect(refuses(ev, `double(...[1])`)).toBe(true);
		}
	});

	// And a host function used to escape as a value: the HostFn box under
	// interpret, the raw function under native.
	it("refuses a host function anywhere but the callee, in both", () => {
		for (const ev of withTools) {
			for (const expr of [
				`double`,
				`[double]`,
				`({ g: double })`,
				`({ double })`,
				`double.name`,
				`double.length`,
				`[1].map(x => double)`,
			]) {
				expect(refuses(ev, expr), expr).toBe(true);
			}
		}
	});

	// Parentheses are not a node — `(double)(1)` parses to the same call.
	it("allows a parenthesised callee", () => {
		for (const ev of withTools) expect(ev.eval(`(double)(21)`)).toBe(42);
	});

	it("still allows a parameter that shadows a tool name", () => {
		for (const ev of withTools) {
			expect(ev.eval(`[1, 2].map(double => double * 2)`)).toEqual([2, 4]);
		}
	});

	it("leaves multi-argument built-ins alone", () => {
		for (const ev of withTools) {
			expect(ev.eval(`parseInt("ff", 16)`)).toBe(255);
			expect(ev.eval(`Math.max(1, 2, 3)`)).toBe(3);
		}
	});
});
