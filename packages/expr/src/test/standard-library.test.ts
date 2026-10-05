import { describe, expect, it, vi } from "vitest";
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
  it("check the clock after building a formatter, which steps barely count", () => {
    let t = 1;
    const now = vi.spyOn(Date, "now").mockImplementation(() => (t += 101));
    try {
      expect(() => ev.eval(`[7, 8].map(n => (1).toLocaleString("en", { minimumIntegerDigits: n }))`)).toThrow(
        /time budget/,
      );
    } finally {
      now.mockRestore();
    }
  });

  it("keep options apart that JSON would print alike", () => {
    expect(ev.eval(`(1.5).toLocaleString("en", { maximumFractionDigits: 0 })`)).toBe("2");
    expect(() => ev.eval(`(1.5).toLocaleString("en", { maximumFractionDigits: NaN })`)).toThrow();
    expect(() => ev.eval(`(1).toLocaleString(null)`)).toThrow();
    expect(ev.eval(`(1).toLocaleString(undefined)`)).toBe((1).toLocaleString());
  });
});

describe("size caps follow what JS builds", () => {
  it("padStart and padEnd with an empty filler return the text unchanged", () => {
    expect(ev.eval("'ab'.padStart(1e7, '')")).toBe("ab");
    expect(ev.eval("'ab'.padEnd(1e7, '')")).toBe("ab");
    expect(ev.eval("'ab'.padStart(5, 'xy')")).toBe("xyxab");
    expect(() => ev.eval("'ab'.padStart(1e7)")).toThrow(/string of/);
  });

  it("counts a method's result once, when it returns", () => {
    const tight = new Evaluator({ budget: { maxTotalAllocation: 1_000 } });
    const context = { s: "a".repeat(600), a: Array(600).fill("x"), b: Array(300).fill(1), c: Array(300).fill("x") };
    for (const expr of [
      "'x'.repeat(600)",
      "'x'.padStart(600)",
      "'x'.concat(s)",
      "s.replaceAll('a', 'b')",
      "s.split('')",
      "a.join('')",
      "c.toString()",
      "b.concat(b)",
      "[b, b].flat()",
      "a.flatMap((x) => x)",
      "JSON.stringify(s)",
    ]) {
      expect(() => tight.eval(expr, context), expr).not.toThrow();
    }
    expect(() => tight.eval("[s.repeat(1), s.repeat(1)]", context)).toThrow(/total allocation/);
  });

  it("a replacement's `$` adds a whole copy only in `$&`, `` $` `` and `$'`", () => {
    expect(ev.eval("s.replaceAll(',', ' $').length", { s: "a,".repeat(100_000) })).toBe(300_000);
    expect(() => ev.eval("s.replaceAll('b', '$`')", { s: "ab".repeat(1_000) })).toThrow(/string of/);
  });
});
