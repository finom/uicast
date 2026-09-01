import { describe, expect, it } from "vitest";
import { Evaluator, ExpressionError } from "../index";

// The standing adversarial corpus. Everything here MUST throw.
//
// Each case is an escape that works, or worked, against a static validator over
// `new Function`. They are grouped by the mechanism they abuse rather than by
// what they achieve, because the point of the design is that a whole mechanism
// closes at once — not that a list of payloads is blocked.

const ev = new Evaluator();

/** Run and report whether it was refused, and with which reason. */
const attempt = (expr: string, context: Record<string, unknown> = {}) => {
	try {
		const value = ev.eval(expr, context);
		return { blocked: false as const, value };
	} catch (err) {
		return {
			blocked: true as const,
			reason: err instanceof ExpressionError ? err.reason : "non-safereval-error",
			message: (err as Error).message,
		};
	}
};

const mustBlock = (expr: string, context?: Record<string, unknown>) => {
	const result = attempt(expr, context);
	expect(result, `EXPECTED BLOCK: ${expr}`).toMatchObject({ blocked: true });
};

describe("reaching the Function constructor", () => {
	it("blocks the documented escape and every spelling of it", () => {
		for (const expr of [
			`({}).constructor`,
			`({})["constructor"]`,
			`({})["con"+"structor"]`,
			`({})["con"+"structor"]["con"+"structor"]("return 1+41")()`,
			`[].constructor`,
			`[]["con"+"structor"]`,
			`"".constructor`,
			`(0).constructor`,
			`(true).constructor`,
			`(x => x).constructor`,
			`({}).__proto__`,
			`({})["__pro"+"to__"]`,
			`({}).__proto__.constructor`,
			`[].__proto__`,
			`({}).constructor.prototype`,
			// The key assembled so no substring of the source spells it.
			`({})[["con","str","uctor"].join("")]`,
			`({})[String.fromCharCode(99,111,110,115,116,114,117,99,116,111,114)]`,
		]) {
			mustBlock(expr);
		}
	});

	it("blocks reaching the prototype graph through an allow-listed namespace", () => {
		for (const expr of [
			`Object.getPrototypeOf([])`,
			`Object.getPrototypeOf(Object.getPrototypeOf([]))`,
			`Object["getPrototypeOf"]([])`,
			`Object["get"+"PrototypeOf"]([])`,
			`Object.defineProperty({}, "x", {})`,
			`Object.setPrototypeOf({}, null)`,
			`Object.getOwnPropertyNames([])`,
			`Object.assign({}, {})`,
			`Object.create(null)`,
			`Math.constructor`,
			`Math["con"+"structor"]`,
			`JSON.constructor`,
			`JSON.parse.constructor`,
			`Array.prototype`,
			`Array.from.constructor`,
		]) {
			mustBlock(expr);
		}
	});

	it("blocks re-binding a receiver", () => {
		for (const expr of [
			`[].map.call`,
			`[].slice.bind`,
			`"".at.apply`,
			`({}).valueOf.call({})`,
			`[]["ca"+"ll"]`,
			`[].sort["ca"+"ll"]`,
		]) {
			mustBlock(expr);
		}
	});

	it("does not let a method be read as a value at all", () => {
		// A method that can be read can be handed somewhere and re-bound. It can
		// only ever be called in place.
		for (const expr of [`[].map`, `"".slice`, `[1,2].filter`, `Math.max`, `JSON.parse`]) {
			mustBlock(expr);
		}
		// …but calling it in place works.
		expect(ev.eval(`[1,2,3].filter(n => n > 1)`)).toEqual([2, 3]);
		expect(ev.eval(`Math.max(1, 5, 3)`)).toBe(5);
	});
});

describe("prototype pollution", () => {
	it("cannot pollute through a computed object-literal key", () => {
		mustBlock(`({ ["__pro"+"to__"]: { pwned: 1 } })`);
		mustBlock(`({ __proto__: { pwned: 1 } })`);
		mustBlock(`({ ["constructor"]: 1 })`);
		expect(({} as Record<string, unknown>).pwned).toBeUndefined();
	});

	it("cannot pollute through Object.fromEntries", () => {
		mustBlock(`Object.fromEntries([["__proto__", { pwned2: 1 }]])`);
		mustBlock(`Object.fromEntries([["con"+"structor", 1]])`);
		expect(({} as Record<string, unknown>).pwned2).toBeUndefined();
	});

	it("cannot pollute through a spread", () => {
		// The source object's own `__proto__` key is not enumerable-own here, and a
		// literal one is rejected outright — either way nothing lands on the chain.
		const result = attempt(`({ ...scopes.evil })`, {
			scopes: { evil: JSON.parse('{"__proto__": {"pwned3": 1}}') },
		});
		expect(result.blocked).toBe(true);
		expect(({} as Record<string, unknown>).pwned3).toBeUndefined();
	});

	it("leaves Object.prototype untouched after the whole suite", () => {
		expect(Object.keys(Object.prototype)).toEqual([]);
	});
});

describe("denial of service", () => {
	it("has no loop syntax to write", () => {
		// The block body is what carried every statement; without it there is no
		// `while`, no `for`, and nothing to put them in.
		mustBlock(`[1].map(() => { while (true) {} })`);
		mustBlock(`[1].map(() => { for (;;) {} })`);
		mustBlock(`[1].map(x => { let i = 0; return i })`);
		mustBlock(`(() => { while(true){} })()`);
	});

	it("cannot name a function to recurse through", () => {
		// No `function` keyword means no name to recurse through; no declarations
		// means no binding to hold one; an IIFE is rejected.
		mustBlock(`[1].map(function f(n) { return f(n) })`);
		mustBlock(`(function f(){ return f() })()`);
		mustBlock(`(f => f(f))(f => f(f))`);
	});

	it("self-application through an array is stopped by the budget", () => {
		// The one recursion the grammar cannot forbid: a lambda handed to itself
		// as an argument. Unbounded, so the step budget is what ends it.
		const result = attempt(`[f => f(f)].map(f => f(f)).length`);
		expect(result).toMatchObject({ blocked: true, reason: "budget-exceeded" });
	});

	it("caps string allocation", () => {
		mustBlock(`"x".repeat(1e9)`);
		mustBlock(`"x".repeat(2000000)`);
		mustBlock(`"x".padStart(1e9, "y")`);
		mustBlock(`"abcdefghij".repeat(100000).repeat(100)`);
	});

	it("caps array allocation", () => {
		mustBlock(`Array.from({ length: 1e9 })`);
		mustBlock(`Array.from({ length: 500000 })`);
		mustBlock(`[1,2,3].flatMap(() => Array.from({ length: 1e9 }))`);
	});

	it("spends a step budget on iteration", () => {
		const rows = Array.from({ length: 5_000 }, (_, i) => i);
		// A realistic pass is affordable under the default budget…
		expect(ev.eval("scopes.rows.map(n => n + 1).length", { scopes: { rows } })).toBe(5_000);
		// …and a deliberately tight budget proves the counter is what stops it,
		// rather than the wall clock happening to expire.
		const tight = new Evaluator({ budget: { steps: 2_000 } });
		let blocked = false;
		try {
			tight.eval("scopes.rows.map(n => n + 1).length", { scopes: { rows } });
		} catch (err) {
			blocked = err instanceof ExpressionError && err.reason === "budget-exceeded";
		}
		expect(blocked).toBe(true);
	});

	it("caps allocation across the whole evaluation, not just per operation", () => {
		// Per-operation caps do not compose. Each of these slices is far under
		// maxArrayLength; five thousand of them were half a gigabyte, allocated in
		// 66ms and entirely within the step budget. Found by measurement, not by
		// reading the code — which is why the running total exists.
		const rows = Array.from({ length: 5000 }, (_, i) => i);
		const result = attempt("scopes.rows.map(x => scopes.rows.slice()).length", {
			scopes: { rows },
		});
		expect(result).toMatchObject({ blocked: true, reason: "budget-exceeded" });

		// A realistic transform over the same data stays well inside it.
		expect(
			ev.eval("scopes.rows.filter(n => n % 2 === 0).length", { scopes: { rows } }),
		).toBe(2500);
	});

	it("has no regular expressions, so ReDoS has nowhere to live", () => {
		mustBlock(`/(a+)+$/.test("aaaaaaaaaaaaaaaaaaaaaaaaaaa!")`);
		mustBlock(`"aaa".replace(/a/g, "b")`);
		mustBlock(`"aaa".match(/a/)`);
		mustBlock(`new RegExp("(a+)+$")`);
		mustBlock(`RegExp("x")`);
	});

	it("caps nesting depth so the compiler cannot blow its own stack", () => {
		// Parentheses are folded by the parser and create no nodes, so nesting has
		// to come from real ones.
		mustBlock(`${"[".repeat(300)}1${"]".repeat(300)}`);
		mustBlock(`${"!".repeat(300)}true`);
		mustBlock(`${"1 + (".repeat(200)}1${")".repeat(200)}`);
	});
});

describe("walking a live object graph", () => {
	class Sneaky {
		secret = "s3cret";
	}

	it("refuses to read anything that is not plain data", () => {
		// The shape of the classic DOM escape: every key in the path is innocent.
		const fakeEvent = {
			target: Object.assign(Object.create({ marker: 1 }), {
				ownerDocument: { defaultView: { fetch: () => {} } },
			}),
		};
		mustBlock(`evt.target.ownerDocument.defaultView`, { evt: fakeEvent });
		mustBlock(`scopes.instance.secret`, { scopes: { instance: new Sneaky() } });
		mustBlock(`scopes.fn`, { scopes: { fn: () => 1 } });
		mustBlock(`scopes.fn()`, { scopes: { fn: () => 1 } });
		mustBlock(`scopes.re.source`, { scopes: { re: /x/ } });
	});

	it("reads plain data through the same path happily", () => {
		const plain = { target: { ownerDocument: { title: "ok" } } };
		expect(ev.eval(`evt.target.ownerDocument.title`, { evt: plain })).toBe("ok");
	});

	it("never walks a prototype chain, named or not", () => {
		const withProto = Object.assign(Object.create({ inherited: "leak" }), { own: "fine" });
		// Not a plain object any more, so it is refused at the boundary…
		mustBlock(`scopes.o.inherited`, { scopes: { o: withProto } });
		// …and a genuinely plain object simply has no inherited members.
		expect(ev.eval(`scopes.o.toString`, { scopes: { o: { a: 1 } } })).toBeUndefined();
		expect(ev.eval(`scopes.o.hasOwnProperty`, { scopes: { o: { a: 1 } } })).toBeUndefined();
		expect(ev.eval(`scopes.o.valueOf`, { scopes: { o: { a: 1 } } })).toBeUndefined();
	});

	it("rejects a symbol as a property key", () => {
		mustBlock(`scopes.o[scopes.sym]`, { scopes: { o: {}, sym: Symbol("x") } });
	});

	it("refuses a raw function value on every read path", () => {
		const fn = () => 1;
		mustBlock(`scopes.o.fn`, { scopes: { o: { fn } } });
		mustBlock(`scopes.arr[0]`, { scopes: { arr: [fn] } });
		mustBlock(`scopes.arr.at(0)`, { scopes: { arr: [fn] } });
		mustBlock(`scopes.m.get("f")`, { scopes: { m: new Map([["f", fn]]) } });
	});
});

describe("code loading and escape hatches", () => {
	it("blocks every route to loading or naming code", () => {
		for (const expr of [
			`import("./evil.js")`,
			`import.meta.url`,
			`eval("1+1")`,
			`arguments`,
			`new Function("return 1")`,
			`Function("return 1")`,
			`globalThis`,
			`window`,
			`self`,
			`global`,
			`process`,
			`require("fs")`,
			`fetch("/x")`,
			`setTimeout(() => 1, 0)`,
			`document`,
			`localStorage`,
			`new Image()`,
			`WebAssembly`,
			`Reflect`,
			`Proxy`,
			`Symbol`,
			`BigInt(1)`,
			`String.raw\`x\``,
			`new.target`,
			`this`,
		]) {
			mustBlock(expr);
		}
	});

	it("blocks writes, deletes, and sequencing", () => {
		for (const expr of [
			`scopes.root.x = 1`,
			`scopes.root.x += 1`,
			`scopes.root.x++`,
			`delete scopes.root.x`,
			`void 0`,
			`(1, 2)`,
			`[1].map(x => scopes.root.x = 1)`,
			`({}) instanceof Object`,
		]) {
			mustBlock(expr, { scopes: { root: { x: 0 } } });
		}
	});

	it("blocks breaking out of the expression wrapper", () => {
		for (const expr of [`1); (2`, `1)); ((2`, `1} ; {`]) {
			mustBlock(expr);
		}
	});
});

describe("what a rejection looks like", () => {
	it("is always a ExpressionError with a classified reason", () => {
		expect(attempt(`({}).constructor`)).toMatchObject({ reason: "guardrail-violation" });
		expect(attempt(`nope()`)).toMatchObject({ reason: "unknown-reference" });
		expect(attempt(`1 +`)).toMatchObject({ reason: "expression-syntax" });
		expect(attempt(`"x".repeat(1e9)`)).toMatchObject({ reason: "budget-exceeded" });
	});

	it("names the offending thing so a repair prompt can act on it", () => {
		const result = attempt(`({}).constructor`);
		expect(result.blocked && result.message).toContain("constructor");
	});
});
