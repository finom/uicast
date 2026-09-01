import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { Evaluator } from "@uicast/expr";
// Cross-package on purpose: these fixtures are hand-maintained documents, and
// nothing else fails loudly when a language change invalidates them (caught
// live once — `await` in the inventory demo after the await cut). The docs
// package has no test runner, so the guard lives with the engine it tests.
import { boardLines } from "../../../../docs/src/demo/board/board.lines";
import { colorLines } from "../../../../docs/src/demo/color/color.lines";
import { inventoryLines } from "../../../../docs/src/demo/inventory/inventory.lines";
import { studioLines } from "../../../../docs/src/demo/studio/studio.lines";

const ev = new Evaluator();

function collect(entry: Record<string, unknown>, out: string[]): void {
	const vs = (v: unknown) => {
		if (v && typeof v === "object" && "expr" in (v as object)) {
			const e = (v as { expr?: unknown }).expr;
			if (typeof e === "string") out.push(e);
		}
	};
	vs(entry.props);
	if (typeof entry.hidden === "string") out.push(entry.hidden);
	if (typeof entry.each === "string") out.push(entry.each);
	for (const step of (entry.seed as unknown[]) ?? []) vs(step);
	for (const steps of Object.values((entry.callbacks as Record<string, unknown[]>) ?? {})) {
		for (const step of steps ?? []) vs(step);
	}
}

describe("every shipped document validates against the current language", () => {
	const sources: [string, Record<string, unknown>[]][] = [
		["board", boardLines as never],
		["color", colorLines as never],
		["inventory", inventoryLines as never],
		["studio", studioLines as never],
	];
	for (const name of ["counter", "tracker", "weather", "orders"]) {
		sources.push([
			`mini:${name}`,
			JSON.parse(
				readFileSync(
					new URL(`../../../../docs/src/lib/mini-examples/${name}/entries.json`, import.meta.url),
					"utf8",
				),
			),
		]);
	}

	for (const [name, entries] of sources) {
		it(name, () => {
			let total = 0;
			for (const entry of entries) {
				const exprs: string[] = [];
				collect(entry, exprs);
				for (const e of exprs) {
					total++;
					expect(() => ev.validate(e), `${String(entry.key)}: ${e}`).not.toThrow();
				}
			}
			expect(total).toBeGreaterThan(0);
		});
	}
});
