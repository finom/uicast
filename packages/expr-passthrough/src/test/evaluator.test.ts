import { describe, expect, it } from "vitest";
import { Evaluator, ExpressionError } from "@uicast/expr";
import { ALLOWED_GLOBALS, parseExpression } from "@uicast/expr/internal";
import { compile } from "../compile";
import { PassthroughEvaluator } from "../index";
import { PLATFORM_GLOBALS } from "../platform-globals";

describe("binding", () => {
	const ev = new PassthroughEvaluator();

	it("contexts are searched right to left", () => {
		expect(ev.eval("a + b", { a: 1, b: 1 }, { a: 10 })).toBe(11);
	});

	it("a name nobody handed in is unknown-reference, not a global", () => {
		expect(() => ev.eval("fetch")).toThrow(expect.objectContaining({ reason: "unknown-reference" }));
		expect(() => ev.eval("nope", { other: 1 })).toThrow(expect.objectContaining({ reason: "unknown-reference" }));
	});

	it("the allowed globals are the real platform objects, bound by name", () => {
		expect([...Object.keys(PLATFORM_GLOBALS)].sort()).toEqual([...ALLOWED_GLOBALS].sort());
		expect(ev.eval("Math.max(1, 2) + parseInt('3') + (undefined === undefined ? 1 : 0)")).toBe(6);
		expect(ev.eval("[NaN, Infinity].map(v => typeof v)")).toEqual(["number", "number"]);
		expect(ev.eval("new Date(0).getTime()")).toBe(0);
	});

	it("a context value shadows a global", () => {
		expect(ev.eval("Math", { Math: 7 })).toBe(7);
	});

	it("every identifier is a parameter, so a name the walker missed is undefined, not a global", () => {
		// compile() with no bindings at all: nothing the source names resolves to anything
		const run = (source: string) =>
			compile({ source, ast: parseExpression(source), freeIds: [], toolCalls: [] }, {})([]);
		expect(run("typeof fetch")).toBe("undefined");
		expect(run("typeof globalThis")).toBe("undefined");
		expect(run("typeof Function")).toBe("undefined");
		expect(run("typeof Math")).toBe("undefined");
	});

	it("a property name or a parameter name is not affected by that", () => {
		expect(ev.eval("({ length: 2, default: 3 }).length")).toBe(2);
		expect(ev.eval("({ public: 1 }).public")).toBe(1);
		expect(ev.eval("[1].map(Math => Math + 1)")).toEqual([2]);
	});
});

describe("construction", () => {
	it("refuses a budget — nothing meters the engine", () => {
		expect(() => new PassthroughEvaluator({ budget: { steps: 1 } } as never)).toThrow(/no budget/);
	});

	it("refuses a host-function name the engine cannot bind in strict mode", () => {
		const tool = (name: string) => ({ name, description: "", execute: () => 1 });
		for (const name of ["static", "let", "eval", "package"]) {
			expect(() => new PassthroughEvaluator({ functions: [tool(name)] }), name).toThrow(/strict mode/);
			// the interpreter has no such constraint
			expect(new Evaluator({ functions: [tool(name)] }).eval(`${name}()`)).toBe(1);
		}
	});

	it("options otherwise match @uicast/expr", () => {
		const ev = new PassthroughEvaluator({ functions: [], maxCacheSize: 10, maxSourceLength: 20 });
		expect(ev.eval("1 + 1")).toBe(2);
		expect(() => ev.eval("1 + 1 + 1 + 1 + 1 + 1 + 1 + 1 + 1")).toThrow(expect.objectContaining({ reason: "expression-syntax" }));
	});
});

describe("the exit gate", () => {
	const ev = new PassthroughEvaluator();
	class Secret {
		secret = "s3cret";
	}
	const ctx = { scopes: { instance: new Secret(), fn: () => 1 } };

	it("reads through a class instance, but cannot emit it", () => {
		expect(ev.eval("scopes.instance.secret", ctx)).toBe("s3cret");
		expect(() => ev.eval("scopes.instance", ctx)).toThrow(ExpressionError);
		expect(() => ev.eval("[scopes.instance]", ctx)).toThrow(ExpressionError);
	});

	it("a function cannot leave, as the result or into a host function", () => {
		let received: unknown = "untouched";
		const send = { name: "send", description: "", execute: (i: unknown) => (received = i) };
		const withSend = new PassthroughEvaluator({ functions: [send] });
		expect(() => ev.eval("scopes.fn", ctx)).toThrow(ExpressionError);
		expect(() => withSend.eval("send(scopes.fn)", ctx)).toThrow(ExpressionError);
		expect(() => withSend.eval("send([x => x])", ctx)).toThrow(ExpressionError);
		expect(received).toBe("untouched");
	});
});

describe("the README", () => {
	it("the opening example", () => {
		const rows = [{ stock: 1 }, { stock: 0 }, { stock: 4 }];
		expect(new PassthroughEvaluator({ functions: [] }).eval("rows.filter(r => r.stock > 0).length", { rows })).toBe(2);
	});

	it("a non-index string key on an array reads what JS reads", () => {
		expect(new PassthroughEvaluator().eval('[9, 8]["0" + "1"]')).toBe(undefined);
	});
});
