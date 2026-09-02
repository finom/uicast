import { describe, expect, it } from "vitest";
import { Evaluator } from "../index";
import { CORPUS, SCOPES } from "./corpus";

// The interpreter against plain JavaScript, on every expression the language allows. The realistic bug in a hand-written evaluator is drift, not escape: `"" == 0`, `-0`, coercion order.

const ev = new Evaluator();
const plainJs = (expr: string): unknown => new Function("scopes", `"use strict"; return (${expr})`)(SCOPES);

describe("the interpreter agrees with plain JavaScript", () => {
	for (const expr of CORPUS) {
		it(expr, () => {
			expect(ev.eval(expr, { scopes: SCOPES })).toEqual(plainJs(expr));
		});
	}
});
