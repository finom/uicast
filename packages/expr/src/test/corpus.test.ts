import { describe, expect, it } from "vitest";
import { ALLOWED_METHOD_NAMES } from "../constants/methods";
import { Evaluator } from "../index";
import { CORPUS, SCOPES } from "./corpus";

// The realistic bug in a hand-written evaluator is drift, not escape: `"" == 0`, `-0`, coercion order.

const ev = new Evaluator();
const plainJs = (expr: string): unknown => new Function("scopes", `"use strict"; return (${expr})`)(SCOPES);

describe("the interpreter agrees with plain JavaScript", () => {
	for (const expr of CORPUS) {
		it(expr, () => {
			expect(ev.eval(expr, { scopes: SCOPES })).toEqual(plainJs(expr));
		});
	}
});

// `Date.now` differs between two calls; the engine under test has no `Math.sumPrecise` (standard-library.test.ts has it).
const NOT_IN_CORPUS = ["now", "sumPrecise"];

it("has a case for every method", () => {
	const called = (name: string) => CORPUS.some((expr) => expr.includes(`.${name}(`) || expr.includes(`[\`${name}\`]`));
	expect([...ALLOWED_METHOD_NAMES].filter((name) => !called(name) && !NOT_IN_CORPUS.includes(name))).toEqual([]);
});
