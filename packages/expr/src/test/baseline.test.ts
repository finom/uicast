import { beforeAll, describe, expect, it, vi } from "vitest";
import { CORPUS, SCOPES } from "./corpus";

// The package needs an ES2022 engine. Everything newer on the language's value kinds is removed here,
// the package is loaded fresh, and the corpus must still give what the current engine gives.
const NEWER: [object, string][] = [
	...["findLast", "findLastIndex", "toReversed", "toSorted", "toSpliced", "with"].map((name): [object, string] => [Array.prototype, name]),
	[String.prototype, "isWellFormed"],
	[String.prototype, "toWellFormed"],
	[Object, "groupBy"],
	[Math, "f16round"],
	[Math, "sumPrecise"],
];

type Outcome = { value: unknown } | { error: string };
const attempt = (run: () => unknown): Outcome => {
	try {
		return { value: run() };
	} catch (err) {
		return { error: err instanceof Error ? err.message : String(err) };
	}
};

const CONTEXT = { scopes: SCOPES };
const plainJs = (expr: string): unknown => new Function("scopes", `"use strict"; return (${expr})`)(SCOPES);
const expected = CORPUS.map((expr): Outcome => attempt(() => plainJs(expr)));

describe("on an ES2022 engine", () => {
	const outcomes: Outcome[] = [];
	const missing: string[] = [];

	beforeAll(async () => {
		const saved = NEWER.map(([target, name]) => Object.getOwnPropertyDescriptor(target, name));
		for (const [target, name] of NEWER) delete (target as Record<string, unknown>)[name];
		try {
			for (const [target, name] of NEWER) if (name in target) missing.push(name);
			vi.resetModules();
			const { Evaluator } = await import("../index");
			const ev = new Evaluator();
			for (const expr of CORPUS) outcomes.push(attempt(() => ev.eval(expr, CONTEXT)));
		} finally {
			NEWER.forEach(([target, name], i) => {
				const descriptor = saved[i];
				if (descriptor) Object.defineProperty(target, name, descriptor);
			});
		}
	});

	it("really lacks the newer built-ins", () => {
		expect(missing).toEqual([]);
	});

	CORPUS.forEach((expr, i) => {
		it(expr, () => {
			expect(outcomes[i]).toEqual(expected[i]);
		});
	});
});
