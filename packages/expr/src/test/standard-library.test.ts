import { describe, expect, it } from "vitest";
import { PRICES } from "../constants/limits";
import { Evaluator } from "../index";

const ev = new Evaluator();
const sum = (xs: unknown[]) => ev.eval<number>("Math.sumPrecise(xs)", { xs });

// Node 24 has no Math.sumPrecise to compare with; these are Chrome's answers.
describe("Math.sumPrecise", () => {
	it("sums exactly, then rounds once", () => {
		expect(sum([1e20, 0.1, -1e20])).toBe(0.1);
		expect(sum([0.1, 0.2])).toBe(0.30000000000000004);
		expect(sum([1, 1e100, 1, -1e100])).toBe(2);
		expect(sum([2 ** 53, 1, 1])).toBe(2 ** 53 + 2);
		expect(sum([1e308, 1e308, -1e308])).toBe(1e308);
		expect(sum([Number.MAX_VALUE, Number.MAX_VALUE])).toBe(Number.POSITIVE_INFINITY);
	});

	it("answers the zero and non-finite cases as the spec does", () => {
		expect(Object.is(sum([]), -0)).toBe(true);
		expect(Object.is(sum([-0, -0]), -0)).toBe(true);
		expect(Object.is(sum([-0, 0]), 0)).toBe(true);
		expect(sum([Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])).toBeNaN();
		expect(sum([Number.NaN, 1])).toBeNaN();
		expect(sum([Number.POSITIVE_INFINITY, 1])).toBe(Number.POSITIVE_INFINITY);
	});

	it("takes numbers only", () => {
		expect(() => sum([1, "2"])).toThrow(/needs numbers/);
	});
});

describe("locale-aware calls", () => {
	it("charge building a locale's Intl object once per evaluation, whether it was cached or not", () => {
		ev.eval(`(1).toLocaleString("fr-FR")`);
		const tight = new Evaluator({ budget: { steps: PRICES.intlBuild } });
		expect(() => tight.eval(`(1).toLocaleString("fr-FR")`)).toThrow(/step budget/);
		const roomy = new Evaluator({ budget: { steps: PRICES.intlBuild + 8 * PRICES.locale + 200 } });
		expect(roomy.eval(`[1, 2, 3].map(n => n.toLocaleString("fr-FR")).length`)).toBe(3);
	});

	it("keep options apart that JSON would print alike", () => {
		expect(ev.eval(`(1.5).toLocaleString("en", { maximumFractionDigits: 0 })`)).toBe("2");
		expect(() => ev.eval(`(1.5).toLocaleString("en", { maximumFractionDigits: NaN })`)).toThrow();
		expect(() => ev.eval(`(1).toLocaleString(null)`)).toThrow();
		expect(ev.eval(`(1).toLocaleString(undefined)`)).toBe((1).toLocaleString());
	});
});
