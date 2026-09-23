import { bench, describe } from "vitest";
import { Evaluator, type StandardToolV0 } from "../index";
import { BUDGET, cases, rows, scopes, WAVE_EXPRS } from "./bench-cases";

const interpret = new Evaluator(BUDGET);

const waveInterpret = WAVE_EXPRS.map((e) => interpret.compile(e));
const wavePlain = WAVE_EXPRS.map(
	(e) => new Function("scopes", `"use strict"; return (${e})`),
);
describe("full wave — 5 expressions × 1000 rows", () => {
	bench("interpret", () => {
		for (const item of rows) {
			const ctx = { scopes: { row: item } };
			for (const f of waveInterpret) f(ctx);
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
	const plain = new Function("scopes", `"use strict"; return (${expr})`);
	describe(label, () => {
		bench("interpret", () => {
			interpreted({ scopes });
		});
		bench("new Function", () => {
			plain(scopes);
		});
	});
}

const identity = (input: unknown) => input;
const numberSchema = {
	"~standard": {
		version: 1,
		vendor: "bench",
		validate: (value: unknown) =>
			typeof value === "number" ? { value } : { issues: [{ message: "number" }] },
		jsonSchema: () => ({ type: "number" }),
	},
} as unknown as NonNullable<StandardToolV0["inputSchema"]>;

const bare = new Evaluator({
	...BUDGET,
	functions: [{ name: "load", description: "", execute: identity } as StandardToolV0],
});
const checked = new Evaluator({
	...BUDGET,
	functions: [
		{
			name: "load",
			description: "",
			inputSchema: numberSchema,
			outputSchema: numberSchema,
			execute: identity,
		} as StandardToolV0,
	],
});

describe("host call", () => {
	const noSchema = bare.compile("load(n)");
	const withSchema = checked.compile("load(n)");
	bench("no schemas", () => {
		noSchema({ n: 1 });
	});
	bench("input + output schema", () => {
		withSchema({ n: 1 });
	});
});
