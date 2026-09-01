import { bench, describe } from "vitest";
import { Evaluator } from "../index";

// Interpreter against the JS engine, on the shapes real documents use.
// The claim being measured: expression evaluation is not on the critical path —
// React reconciliation and the DOM are — so a constant-factor slowdown on
// sub-microsecond work does not show up in a frame.

const BUDGET = { budget: { steps: 50_000_000, ms: 60_000 } };
const interpret = new Evaluator({ mode: "interpret", ...BUDGET });
const native = new Evaluator({ mode: "native", ...BUDGET });

const rows = Array.from({ length: 1000 }, (_, i) => ({
	id: i,
	name: `Item ${i}`,
	stock: i % 50,
	price: (i % 17) + 0.5,
}));
const scopes = { root: { count: 3, q: "Item 1", user: { name: "Ada" }, products: rows } };

const cases: [string, string][] = [
	["predicate", "scopes.root.count > 0"],
	["member chain", "scopes.root.user.name"],
	// biome-ignore lint/suspicious/noTemplateCurlyInString: the string IS the expression under test
	["template", "`${scopes.root.user.name} has ${scopes.root.count} items`"],
	["object literal", "({ label: scopes.root.user.name, value: scopes.root.count })"],
	["filter 1000", "scopes.root.products.filter(p => p.stock <= 20).length"],
	["map 1000", "scopes.root.products.map(p => p.name).length"],
	[
		"reduce 1000",
		"scopes.root.products.reduce((s, p) => s + p.price * p.stock, 0)",
	],
];

// One reactive wave over a realistic table: 1000 rows, five expression sites
// per row (props, hidden, text) — the composite the docs quote.
const WAVE_EXPRS = [
	"({ text: scopes.row.item.name })",
	"({ text: scopes.row.item.id + 1 })",
	"scopes.row.item.stock > 0",
	// biome-ignore lint/suspicious/noTemplateCurlyInString: the string IS the expression under test
	"`${scopes.row.item.name}: ${scopes.row.item.price.toFixed(2)}`",
	"({ value: scopes.row.item.price })",
];
const waveInterpret = WAVE_EXPRS.map((e) => interpret.compile(e));
const waveNative = WAVE_EXPRS.map((e) => native.compile(e));
const wavePlain = WAVE_EXPRS.map(
	(e) => new Function("scopes", `"use strict"; return (${e})`),
);
describe("full wave — 5 expressions × 1000 rows", () => {
	bench("interpret", () => {
		for (const item of rows) {
			const ctx = { scopes: { row: { item } } };
			for (const f of waveInterpret) f(ctx);
		}
	});
	bench("native", () => {
		for (const item of rows) {
			const ctx = { scopes: { row: { item } } };
			for (const f of waveNative) f(ctx);
		}
	});
	bench("new Function", () => {
		for (const item of rows) {
			const ctx = { scopes: { row: { item } } };
			for (const f of wavePlain) f(ctx.scopes);
		}
	});
});

for (const [label, expr] of cases) {
	const interpreted = interpret.compile(expr);
	const emitted = native.compile(expr);
	const plain = new Function("scopes", `"use strict"; return (${expr})`);
	describe(label, () => {
		bench("interpret", () => {
			interpreted({ scopes });
		});
		bench("native", () => {
			emitted({ scopes });
		});
		bench("new Function", () => {
			plain(scopes);
		});
	});
}
