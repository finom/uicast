import { describe, expect, it } from "vitest";
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
	it("use the viewer's locale and refuse a locale or options, before anything runs", () => {
		expect(ev.eval(`(1234.5).toLocaleString()`)).toBe((1234.5).toLocaleString());
		expect(ev.eval(`"a".localeCompare("b")`)).toBe("a".localeCompare("b"));
		for (const expr of [
			`(1).toLocaleString(undefined)`,
			`(1.5).toLocaleString("en", { maximumFractionDigits: 0 })`,
			`new Date(0).toLocaleDateString("en-US")`,
			`new Date(0).toLocaleTimeString(undefined, { hour: "2-digit" })`,
			`"i".toLocaleUpperCase("tr")`,
			`"a".localeCompare("b", "en")`,
			`[1].toLocaleString(...["de"])`,
		]) {
			expect(() => ev.validate(expr), expr).toThrow(/uses the viewer's locale/);
		}
	});
});
