import { describe, expect, it } from "vitest";
import { Evaluator, ExpressionError, type StandardToolV0 } from "../index";

class Secret {
	secret = "s3cret";
}
const fn = () => "live";
const ctx = { f: fn, scopes: { o: { fn, n: 1 }, arr: [fn], instance: new Secret(), self: {} as Record<string, unknown> } };
ctx.scopes.self.me = ctx.scopes.self;

const refuses = (ev: Evaluator, expr: string): boolean => {
	try {
		ev.eval(expr, ctx);
		return false;
	} catch (err) {
		return ExpressionError.is(err);
	}
};

describe("a function cannot leave an expression", () => {
	it("through every bulk copy", () => {
		const ev = new Evaluator();
		for (const expr of [
			"scopes.arr",
			"[...scopes.arr]",
			"scopes.arr.slice()",
			"scopes.arr.filter(() => true)",
			"Object.values(scopes.o)",
			"Object.entries(scopes.o)",
			"({ ...scopes.o })",
			"[1].map(() => scopes.arr)[0]",
		]) {
			expect(refuses(ev, expr), expr).toBe(true);
		}
	});

	it("an arrow outside a method's callback is refused before it runs", () => {
		expect(refuses(new Evaluator(), "Object.values(x => x * 2)")).toBe(true);
		expect(refuses(new Evaluator(), "[x => x]")).toBe(true);
	});

	it("and not into a host function", () => {
		let received: unknown = "untouched";
		const send = { name: "send", description: "", execute: (i: unknown) => (received = i) } as StandardToolV0;
		const ev = new Evaluator({ functions: [send] });
		expect(refuses(ev, "send(Object.values(scopes.o))")).toBe(true);
		expect(refuses(ev, "send(scopes.arr)")).toBe(true);
		expect(received).toBe("untouched");
	});
});

describe("a function's source cannot be read", () => {
	it("by any conversion", () => {
		const ev = new Evaluator();
		for (const expr of [
			"f + ''",
			"scopes.arr + ''",
			// biome-ignore lint/suspicious/noTemplateCurlyInString: the string IS the expression under test
			"`${scopes.arr}`",
			"scopes.arr.join()",
			"String(...scopes.arr)",
			"''.concat(...scopes.arr)",
			"'x'.includes(...scopes.arr)",
			"scopes.arr.toSorted().length",
			"scopes.arr.map(x => x + '')",
			"scopes.arr.reduce((s, x) => s + x, '')",
			// biome-ignore lint/suspicious/noTemplateCurlyInString: the string IS the expression under test
			"[scopes.arr].map(([x]) => `${x}`)",
		]) {
			expect(refuses(ev, expr), expr).toBe(true);
		}
	});
});

describe("a class instance cannot be read through a bulk copy", () => {
	it("the receiver gate applies to Object.* and spread", () => {
		const ev = new Evaluator();
		expect(refuses(ev, "scopes.instance.secret")).toBe(true);
		expect(refuses(ev, "Object.values(scopes.instance)")).toBe(true);
		expect(refuses(ev, "Object.entries(scopes.instance)")).toBe(true);
		expect(refuses(ev, "Object.keys(scopes.instance)")).toBe(true);
		expect(refuses(ev, "({ ...scopes.instance })")).toBe(true);
	});
});

it("plain data still flows", () => {
	const ev = new Evaluator();
	expect(ev.eval("Object.keys({ a: 1, b: 2 })")).toEqual(["a", "b"]);
	expect(ev.eval("Object.values({ a: 1, b: 2 })")).toEqual([1, 2]);
	expect(ev.eval("Object.entries({ a: 1 })")).toEqual([["a", 1]]);
	expect(ev.eval("Object.fromEntries([['a', 1]])")).toEqual({ a: 1 });
	expect(ev.eval("Object.fromEntries(new Set([['a', 1]]))")).toEqual({ a: 1 });
	expect(ev.eval("[new Date(0), new Set([1])].length")).toBe(2);
	// a cycle in host data is walked once, not forever
	expect(ev.eval("scopes.self", ctx)).toBe(ctx.scopes.self);
});

describe("only JSON-shaped data leaves", () => {
	it("a Date or a Set is refused as the result or a host function's input, with the conversion to write", () => {
		let received: unknown = "untouched";
		const send = { name: "send", description: "", execute: (i: unknown) => (received = i) } as StandardToolV0;
		const ev = new Evaluator({ functions: [send] });
		expect(() => ev.eval("new Date(0)")).toThrow(/The result contains a Date.*toISOString/);
		expect(() => ev.eval("({ when: new Date(0) })")).toThrow(/contains a Date/);
		expect(() => ev.eval("new Set([1])")).toThrow(/The result contains a Set.*\[\.\.\.set\]/);
		expect(() => ev.eval("send({ tags: new Set(['a']) })")).toThrow(/"send" argument contains a Set/);
		expect(received).toBe("untouched");
		expect(ev.eval("new Date(0).toISOString()")).toBe("1970-01-01T00:00:00.000Z");
		expect(ev.eval("[...new Set([1, 1, 2])]")).toEqual([1, 2]);
	});
});

describe("what a built-in throws is classified, not raw", () => {
	it("every case", () => {
		const ev = new Evaluator();
		for (const expr of [
			"(1).toFixed(101)",
			"Object.keys(null)",
			'encodeURIComponent("\\uD800")',
			'"a".repeat(-1)',
			"Object.fromEntries(1)",
		]) {
			expect(refuses(ev, expr), expr).toBe(true);
		}
	});
});

describe("budgets cover built-in loops", () => {
	it("Object.fromEntries charges per pair and refuses a string", () => {
		const big = Array.from({ length: 1000 }, (_, i) => [String(i), i]);
		const ev = new Evaluator({ budget: { steps: 100 } });
		expect(() => ev.eval("Object.fromEntries(big)", { big })).toThrow(
			expect.objectContaining({ reason: "budget-exceeded" }),
		);
		expect(() => ev.eval("Object.fromEntries('abcdef')")).toThrow(/pairs/);
	});
});

it("__proto__ is not a name an expression can use", () => {
	const ev = new Evaluator();
	expect(() => ev.eval("__proto__", { __proto__: 1 } as never)).toThrow(ExpressionError);
});

describe("`...rest` in a pattern is a bulk copy too", () => {
	it("goes through the receiver gate", () => {
		const ev = new Evaluator();
		expect(refuses(ev, "[scopes.instance].map(({ ...r }) => r.secret)")).toBe(true);
		expect(refuses(ev, "[scopes.o].map(({ ...r }) => r.fn)")).toBe(true);
	});
	it("still destructures plain data, minus the taken keys", () => {
		expect(new Evaluator().eval("[{ a: 1, b: 2, c: 3 }].map(({ a, ...r }) => r)")).toEqual([{ b: 2, c: 3 }]);
	});
	it("is charged per key", () => {
		const big = Object.fromEntries(Array.from({ length: 1000 }, (_, i) => [String(i), i]));
		expect(() => new Evaluator({ budget: { steps: 100 } }).eval("[big].map(({ ...r }) => r)", { big })).toThrow(
			expect.objectContaining({ reason: "budget-exceeded" }),
		);
	});
});

it("deep data is refused, not a stack overflow", () => {
	expect(() => new Evaluator().eval("Array.from({ length: 10000 }).reduce(a => [a], [])")).toThrow(
		expect.objectContaining({ reason: "guardrail-violation" }),
	);
});

it("a tool returning non-data is the host's fault", () => {
	const bad = { name: "bad", description: "", execute: () => ({ rows: [], onClick: () => 1 }) } as StandardToolV0;
	expect(() => new Evaluator({ functions: [bad] }).eval("bad()")).toThrow(
		expect.objectContaining({ reason: "host-function" }),
	);
});
