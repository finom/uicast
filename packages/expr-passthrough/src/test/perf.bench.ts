import { bench, describe } from "vitest";
import { Evaluator } from "@uicast/expr";
import { BUDGET, cases, rows, scopes, WAVE_EXPRS } from "../../../expr/src/test/bench-cases";
import { PassthroughEvaluator } from "../index";

const interpret = new Evaluator(BUDGET);
const passthrough = new PassthroughEvaluator();
const plain = (expr: string) => new Function("scopes", `"use strict"; return (${expr})`);

const waveInterpret = WAVE_EXPRS.map((e) => interpret.compile(e));
const wavePassthrough = WAVE_EXPRS.map((e) => passthrough.compile(e));
const wavePlain = WAVE_EXPRS.map(plain);

describe("full wave — 5 expressions × 1000 rows", () => {
	bench("Evaluator", () => {
		for (const item of rows) {
			const ctx = { scopes: { row: item } };
			for (const f of waveInterpret) f(ctx);
		}
	});
	bench("PassthroughEvaluator", () => {
		for (const item of rows) {
			const ctx = { scopes: { row: item } };
			for (const f of wavePassthrough) f(ctx);
		}
	});
	bench("new Function", () => {
		for (const item of rows) {
			const ctx = { scopes: { row: item } };
			for (const f of wavePlain) f(ctx.scopes);
		}
	});
});

for (const [label, expr] of cases) {
	const interpreted = interpret.compile(expr);
	const passed = passthrough.compile(expr);
	const bare = plain(expr);
	describe(label, () => {
		bench("Evaluator", () => {
			interpreted({ scopes });
		});
		bench("PassthroughEvaluator", () => {
			passed({ scopes });
		});
		bench("new Function", () => {
			bare(scopes);
		});
	});
}
