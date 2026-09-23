import { describe, expect, it } from "vitest";
import { Evaluator, ExpressionError } from "../index";
import { SCOPES } from "./corpus";

const ev = new Evaluator();
const run = (expr: string, context: Record<string, unknown> = {}) => ev.eval(expr, context);

describe("the language", () => {
	it("evaluates literals and templates", () => {
		expect(run(`1`)).toBe(1);
		expect(run(`"a"`)).toBe("a");
		expect(run(`true`)).toBe(true);
		expect(run(`null`)).toBe(null);
		expect(run(`undefined`)).toBe(undefined);
		// biome-ignore lint/suspicious/noTemplateCurlyInString: the string IS the expression under test
		expect(run("`n=${1 + 2}`")).toBe("n=3");
		// biome-ignore lint/suspicious/noTemplateCurlyInString: the string IS the expression under test
		expect(run("`${null}|${undefined}`")).toBe("null|undefined");
		// biome-ignore lint/suspicious/noTemplateCurlyInString: the string IS the expression under test
		expect(run("`${scopes.root.user.name} <${scopes.root.user.email}>`", { scopes: SCOPES }))
			.toBe("Ada <ada@example.com>");
	});

	it("reads members, static and computed", () => {
		expect(run(`scopes.root.count`, { scopes: SCOPES })).toBe(3);
		expect(run(`scopes.root["count"]`, { scopes: SCOPES })).toBe(3);
		expect(run(`scopes.root.products[1].name`, { scopes: SCOPES })).toBe("Gadget");
		expect(run(`scopes.root.products.length`, { scopes: SCOPES })).toBe(3);
		expect(run(`"abc"[1]`)).toBe("b");
		expect(run(`"abc".length`)).toBe(3);
		expect(run(`scopes.root.missing`, { scopes: SCOPES })).toBe(undefined);
	});

	it("short-circuits optional chains", () => {
		expect(run(`scopes.root.nothing?.deep`, { scopes: SCOPES })).toBe(undefined);
		expect(run(`scopes.root.nothing?.deep.deeper`, { scopes: SCOPES })).toBe(undefined);
		expect(run(`scopes.root.user?.name`, { scopes: SCOPES })).toBe("Ada");
		expect(run(`scopes.root.nothing?.[0]`, { scopes: SCOPES })).toBe(undefined);
	});

	it("applies operators", () => {
		expect(run(`1 + 2 * 3`)).toBe(7);
		expect(run(`2 ** 10`)).toBe(1024);
		expect(run(`7 % 3`)).toBe(1);
		expect(run(`"a" + "b"`)).toBe("ab");
		expect(run(`1 == "1"`)).toBe(true);
		expect(run(`1 === "1"`)).toBe(false);
		expect(run(`!0`)).toBe(true);
		expect(run(`-5`)).toBe(-5);
		expect(run(`typeof "x"`)).toBe("string");
		expect(run(`1 < 2 && 3 > 2`)).toBe(true);
		expect(run(`null ?? "fallback"`)).toBe("fallback");
		expect(run(`0 || "fallback"`)).toBe("fallback");
		expect(run(`1 > 2 ? "yes" : "no"`)).toBe("no");
	});

	it("builds arrays and objects, with spread and computed keys", () => {
		expect(run(`[1, 2, 3]`)).toEqual([1, 2, 3]);
		expect(run(`[...[1, 2], 3]`)).toEqual([1, 2, 3]);
		expect(run(`({ a: 1, b: 2 })`)).toEqual({ a: 1, b: 2 });
		expect(run(`({ ...{ a: 1 }, b: 2 })`)).toEqual({ a: 1, b: 2 });
		expect(run(`({ ["k" + 1]: "v" })`)).toEqual({ k1: "v" });
		expect(run(`({ label: "Low stock", value: scopes.root.count })`, { scopes: SCOPES }))
			.toEqual({ label: "Low stock", value: 3 });
	});

	it("runs array methods with inline functions", () => {
		const scopes = { scopes: SCOPES };
		expect(run(`scopes.root.products.filter(p => p.stock <= 20).length`, scopes)).toBe(2);
		expect(run(`scopes.root.products.map(p => p.name)`, scopes)).toEqual([
			"Widget", "Gadget", "Doohickey",
		]);
		expect(run(`scopes.root.products.reduce((s, p) => s + p.stock, 0)`, scopes)).toBe(52);
		expect(run(`scopes.root.products.find(p => p.sku === "G-2").price`, scopes)).toBe(24);
		expect(run(`scopes.root.products.some(p => p.stock === 0)`, scopes)).toBe(true);
		expect(run(`scopes.root.products.every(p => p.price > 1)`, scopes)).toBe(true);
		expect(run(`[3, 1, 2].toSorted((a, b) => a - b)`)).toEqual([1, 2, 3]);
		expect(run(`[1, 2, 3].slice(1).join("-")`)).toBe("2-3");
		expect(run(`[[1], [2, 3]].flat()`)).toEqual([1, 2, 3]);
	});

	it("destructures arrow parameters", () => {
		expect(run(`[{ a: 1 }, { a: 2 }].map(({ a }) => a)`)).toEqual([1, 2]);
		expect(run(`[[1, 2]].map(([x, y]) => x + y)`)).toEqual([3]);
		expect(run(`[{}].map(({ a = 7 }) => a)`)).toEqual([7]);
		expect(run(`[1, 2].map((n, i) => n * i)`)).toEqual([0, 2]);
	});

	it("does not mutate the array a method was called on", () => {
		const rows = [3, 1, 2];
		expect(run(`scopes.rows.toSorted((a, b) => a - b)`, { scopes: { rows } })).toEqual([1, 2, 3]);
		expect(rows).toEqual([3, 1, 2]);
		expect(run(`scopes.rows.toReversed()`, { scopes: { rows } })).toEqual([2, 1, 3]);
		expect(rows).toEqual([3, 1, 2]);
	});

	it("exposes the allow-listed globals", () => {
		expect(run(`Math.round(2.6)`)).toBe(3);
		expect(run(`Math.PI > 3`)).toBe(true);
		expect(run(`JSON.stringify({ a: 1 })`)).toBe('{"a":1}');
		expect(run(`JSON.parse('{"a":1}').a`)).toBe(1);
		expect(run(`Object.keys({ a: 1, b: 2 })`)).toEqual(["a", "b"]);
		expect(run(`Object.entries({ a: 1 })`)).toEqual([["a", 1]]);
		expect(run(`Object.fromEntries([["a", 1]])`)).toEqual({ a: 1 });
		expect(run(`Array.isArray([])`)).toBe(true);
		expect(run(`Array.from("ab")`)).toEqual(["a", "b"]);
		expect(run(`Number("42") + 1`)).toBe(43);
		expect(run(`String(42).length`)).toBe(2);
		expect(run(`parseInt("ff", 16)`)).toBe(255);
		expect(run(`(255).toString(16)`)).toBe("ff");
		expect(run(`(1234.5).toFixed(1)`)).toBe("1234.5");
		expect(run(`encodeURIComponent("a b")`)).toBe("a%20b");
		expect(run(`"a,b".split(",")`)).toEqual(["a", "b"]);
		expect(run(`"  x ".trim()`)).toBe("x");
		expect(run(`"ab".toUpperCase()`)).toBe("AB");
	});

	it("has no new: every value is JSON, and a date is a string or a timestamp", () => {
		expect(run(`Date.now() > 0`)).toBe(true);
		expect(run(`Date.parse("1970-01-02T00:00:00Z")`)).toBe(86_400_000);
		for (const expr of [`new Date(0)`, `new Set([1])`, `new Map()`, `new Intl.NumberFormat("en-US")`, `new URL("https://a.example.com/")`]) {
			expect(() => run(expr), expr).toThrow(/"new" is not part of the expression language/);
		}
	});

	it("rejects an expression over the source-length limit before parsing it", () => {
		const long = `"a" + ${'"b" + '.repeat(200)}"c"`;
		expect(long.length).toBeGreaterThan(1000);
		expect(() => run(long)).toThrow(/too long .*limit is 1000/);
		const tight = new Evaluator({ maxSourceLength: 10 });
		expect(() => tight.eval("1 + 1 + 1 + 1")).toThrow(/limit is 10/);
		expect(tight.eval("1 + 1")).toBe(2);
	});

	it("rejects await — the host awaits results, the expression never does", () => {
		expect(() => run(`await load()`)).toThrow(/not allowed|AwaitExpression/);
	});

	it("rejects the mutating sort and reverse", () => {
		expect(() => run(`[3,1,2].sort()`)).toThrow(/not an available method/);
		expect(() => run(`[3,1,2].reverse()`)).toThrow(/not an available method/);
	});

	it("does not unwrap a promise that was never awaited", () => {
		// The renderer relies on this: a host call in a reactive site must surface
		// as a Promise so it can be reported, not silently resolve.
		const withTool = new Evaluator({
			functions: [{ name: "hostCall", description: "", execute: async () => 1 }],
		});
		const value = withTool.eval(`hostCall(1)`);
		expect(value).toBeInstanceOf(Promise);
	});

	it("reports the facts a host needs", () => {
		const source = `scopes.root.products.filter(p => p.stock <= scopes.root.count).length`;
		const facts = ev.validate(source);
		expect(facts.freeIds).toContain("scopes");
		expect([...ev.memberReads(source, "scopes")].sort()).toEqual([
			"scopes.root.count",
			"scopes.root.products",
		]);
		expect([...ev.memberReads(`data.a + data.b + other.c`, "data")].sort()).toEqual([
			"data.a",
			"data.b",
		]);
	});
});

describe("differential against new Function", () => {
	const CONTEXT = { scopes: SCOPES };

	const native = (expr: string): unknown => {
		const fn = new Function("scopes", `"use strict"; return (${expr})`);
		return fn(CONTEXT.scopes);
	};

	it("matches JS on the expressions the demo documents actually use", () => {
		const demo: [string, unknown][] = [
			[`scopes.root.products.filter(p => p.stock <= 20).length`, 2],
			[
				`({ label: 'Inventory value', value: '$' + Math.round(scopes.root.products.reduce((s, p) => s + p.price * p.stock, 0)).toLocaleString() })`,
				{ label: "Inventory value", value: "$1,074" },
			],
			[
				`scopes.root.products.filter(p => !scopes.root.q || p.name.toLowerCase().includes(scopes.root.q.toLowerCase()) || p.sku.toLowerCase().includes(scopes.root.q.toLowerCase()))`,
				[SCOPES.root.products[0]],
			],
			[
				`(scopes.root.products || []).map(c => ({ label: c.name, value: c.name }))`,
				[
					{ label: "Widget", value: "Widget" },
					{ label: "Gadget", value: "Gadget" },
					{ label: "Doohickey", value: "Doohickey" },
				],
			],
		];
		for (const [expr, expected] of demo) {
			expect(run(expr, CONTEXT), expr).toEqual(expected);
			expect(native(expr), `native: ${expr}`).toEqual(expected);
		}
	});
});

describe("a function is written only where a method takes one", () => {
	const rows = { rows: [{ a: 1, s: "x" }, { a: 2, s: "y" }] };

	it("accepts every callback position", () => {
		expect(run(`rows.map(r => r.a)`, rows)).toEqual([1, 2]);
		expect(run(`rows?.map(r => r.a)`, rows)).toEqual([1, 2]);
		expect(run(`rows["filter"](r => r.a > 1).length`, rows)).toBe(1);
		expect(run(`rows.map(r => rows.filter(o => o.a <= r.a).length)`, rows)).toEqual([1, 2]);
		expect(run(`Array.from({ length: 2 }, (_, i) => i * 2)`)).toEqual([0, 2]);
		expect(run(`Object.keys(Object.groupBy(rows, r => r.s))`, rows)).toEqual(["x", "y"]);
	});

	it("accepts a global that takes one argument, and no other", () => {
		expect(run(`[0, 1, "", "a", null].filter(Boolean)`)).toEqual([1, "a"]);
		expect(run(`["1", "2.5"].map(Number)`)).toEqual([1, 2.5]);
		expect(run(`Array.from("12", Number)`)).toEqual([1, 2]);
		expect(run(`rows[k](Boolean).length`, { rows: [0, 1], k: "filter" })).toBe(1);
		for (const expr of [`["1", "2"].map(parseInt)`, `[1].map(Math)`, `[1].map(Date)`, `[[1]].map(Array)`, `[1].filter(Object)`]) {
			expect(() => ev.validate(expr), expr).toThrow(/only a global that takes one argument/);
		}
		expect(() => run(`rows[k](Math)`, { rows: [1], k: "map" })).toThrow(/"Math" cannot be passed as a callback/);
	});

	it("refuses one anywhere else", () => {
		for (const expr of [
			`x => x`,
			`[x => x]`,
			`({ f: x => x })`,
			`typeof (x => x)`,
			`(x => x)(1)`,
			`true ? x => 1 : x => 2`,
			`rows.map(r => x => x)`,
			`rows.map((r = x => x) => r)`,
			`rows.reduce((a, r) => a, x => x)`,
			`rows.concat(x => x)`,
			`JSON.stringify(x => x)`,
			`rows[k](x => x)`,
			`Array.from(x => x)`,
			`[f => f(f)].map(f => f(f))`,
		]) {
			expect(() => ev.validate(expr), expr).toThrow(/can only be written as a method's callback/);
		}
	});
});

describe("a host call stands only where its value is the result", () => {
	const functions = [
		{ name: "getOrder", description: "", execute: async (input: unknown) => input },
		{ name: "save", description: "", execute: (input: unknown) => input },
	];
	const withTools = new Evaluator({ functions });

	it("returns its promise from any result position", () => {
		for (const expr of [
			`getOrder({ id: 1 })`,
			`c ? getOrder({ id: 1 }) : null`,
			`c ? (d ? null : getOrder({ id: 1 })) : null`,
			`cached ?? getOrder({ id: 1 })`,
			`c && getOrder({ id: 1 })`,
			`d || getOrder({ id: 1 })`,
		]) {
			expect(withTools.eval(expr, { c: true, d: false, cached: null }), expr).toBeInstanceOf(Promise);
		}
		expect(withTools.eval(`cached ?? getOrder({ id: 1 })`, { cached: 5 })).toBe(5);
	});

	it("refuses one that is part of the result, before anything runs", () => {
		let calls = 0;
		const counted = new Evaluator({ functions: [{ name: "getOrder", description: "", execute: async () => calls++ }] });
		for (const expr of [
			`[getOrder({ id: 1 }), getOrder({ id: 2 })]`,
			`({ order: getOrder({ id: 1 }) })`,
			`getOrder({ id: 1 }).name`,
			`getOrder({ id: 1 }) ?? 5`,
			`getOrder({ id: 1 }) ? 1 : 2`,
			`!getOrder({ id: 1 })`,
			// biome-ignore lint/suspicious/noTemplateCurlyInString: the string IS the expression under test
			"`${getOrder({ id: 1 })}`",
			`JSON.stringify(getOrder({ id: 1 }))`,
			`getOrder(getOrder({ id: 1 }))`,
		]) {
			expect(() => counted.eval(expr), expr).toThrow(/must be the result itself/);
		}
		expect(calls).toBe(0);
	});

	it("refuses a host function inside a callback before anything runs", () => {
		let calls = 0;
		const counted = new Evaluator({
			functions: [{ name: "deleteOrder", description: "", execute: async () => calls++ }],
		});
		for (const expr of [
			`ids.find(id => deleteOrder({ id }))`,
			`ids.filter(id => deleteOrder({ id }))`,
			`ids.some(id => deleteOrder({ id }))`,
			`ids.map(id => deleteOrder({ id }))`,
			`ids.reduce((acc, id) => deleteOrder({ id }), 0)`,
			`ids.toSorted((a, b) => deleteOrder({ id: a }))`,
			`Array.from(ids, id => deleteOrder({ id }))`,
			`Object.groupBy(ids, id => deleteOrder({ id }))`,
			`ids.map((id, i = deleteOrder({ id })) => i)`,
			`ids.map(id => [id].map(x => deleteOrder({ id: x })))`,
		]) {
			expect(() => counted.validate(expr), expr).toThrow(/cannot be called inside a callback.*returns everything/);
			expect(() => counted.eval(expr, { ids: [1, 2, 3] }), expr).toThrow(ExpressionError);
		}
		expect(calls).toBe(0);
		// A parameter named like the function shadows it.
		expect(counted.eval(`ids.map(deleteOrder => deleteOrder)`, { ids: [1] })).toEqual([1]);
	});

	it("refuses a promise held in data as part of the result or a host function's input", () => {
		const scopes = { p: Promise.resolve(1) };
		expect(() => withTools.eval(`save(scopes.p)`, { scopes })).toThrow(/"save" argument holds a promise/);
		expect(() => withTools.eval(`[scopes.p]`, { scopes })).toThrow(/inside an array or object/);
	});

	it("leaves no rejection unhandled", async () => {
		const failing = new Evaluator({
			functions: [{ name: "boom", description: "", execute: () => ({ later: Promise.reject(new Error("down")) }) }],
		});
		const unhandled: unknown[] = [];
		const listen = (reason: unknown) => unhandled.push(reason);
		process.on("unhandledRejection", listen);
		try {
			expect(() => failing.eval(`boom()`)).toThrow(ExpressionError);
			await new Promise((resolve) => setTimeout(resolve, 10));
		} finally {
			process.off("unhandledRejection", listen);
		}
		expect(unhandled).toEqual([]);
	});
});

describe("deliberate divergences from plain JS", () => {
	it("`typeof` on an unknown name throws instead of answering 'undefined'", () => {
		expect(() => run(`typeof nope`)).toThrow(/not available/);
	});
});

describe("cut syntax — recognizable JS the language deliberately refuses", () => {
	it("has no `in`, bitwise, or optional-call operators", () => {
		for (const expr of [
			`"a" in scopes.o`,
			`1 & 2`,
			`1 | 2`,
			`1 ^ 2`,
			`1 << 2`,
			`8 >> 2`,
			`8 >>> 2`,
			`scopes.o.f?.()`,
			`scopes.missing?.()`,
		]) {
			expect(() => run(expr, { scopes: { o: { a: 1 }, missing: undefined } }), expr).toThrow();
		}
		expect(run(`scopes.o?.a`, { scopes: { o: { a: 1 } } })).toBe(1);
	});

	it("has no holes in an array literal", () => {
		for (const expr of [`[1, , 2]`, `[, 1]`, `[1, , ]`]) {
			expect(() => ev.validate(expr), expr).toThrow(/cannot skip an item/);
		}
		expect(run(`[1, undefined, 2].length`)).toBe(3);
		expect(run(`[1, 2, ]`)).toEqual([1, 2]);
	});

	it("has no method that only runs a callback for its effect, or returns an iterator", () => {
		for (const expr of [`[1].forEach(n => n)`, `[1].values()`, `[1].keys()`]) {
			expect(() => run(expr), expr).toThrow(/not an available method/);
		}
	});
});

describe("evaluation plumbing", () => {
	it("keeps sequential evaluations' budgets independent", () => {
		const tight = new Evaluator({ budget: { steps: 2_000 } });
		const rows = Array.from({ length: 300 }, (_, i) => i);
		for (let i = 0; i < 10; i++) {
			expect(tight.eval(`scopes.rows.map(n => n + 1).length`, { scopes: { rows } })).toBe(300);
		}
	});

	it("Math.random is not in the language", () => {
		expect(() => run(`Math.random()`)).toThrow(/"Math.random\(\)" is not available/);
	});

	it("a large flatMap of singletons stays inside the budget", () => {
		const rows = Array.from({ length: 20_000 }, (_, i) => i);
		expect(run(`scopes.rows.flatMap(n => [n]).length`, { scopes: { rows } })).toBe(20_000);
	});
});

describe("pinned against plain JS", () => {
	it("a non-canonical numeric string is not an index — and a non-index string key on an array is refused", () => {
		expect(run('[9, 8]["1"]')).toBe(8);
		expect(() => run('[9, 8]["0" + "1"]')).toThrow(ExpressionError);
	});
	it("toLocaleString takes a locale", () => {
		expect(run("[1234.5].toLocaleString('de')")).toBe([1234.5].toLocaleString("de"));
	});
	it("valueOf on a number", () => {
		expect(run("(1).valueOf()")).toBe(1);
	});
	it("a computed key in a pattern is evaluated", () => {
		expect(run("[{ a: 1 }].map(({ [k]: v }) => v)", { k: "a" })).toEqual([1]);
	});
	it("a callback that is not a function throws, even over an empty array", () => {
		for (const expr of ["[].map(5)", "[].every(null)", "[].toSorted(5)", "[].reduce(1, 0)", "Array.from([], null)"]) {
			expect(() => run(expr), expr).toThrow(ExpressionError);
			expect(() => new Function(`return (${expr})`)(), expr).toThrow(TypeError);
		}
	});
	it("a trailing line comment ends at the end of the expression", () => {
		expect(run("1 + 2 // sum")).toBe(3);
	});
});
