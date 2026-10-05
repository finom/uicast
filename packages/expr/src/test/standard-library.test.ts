import { describe, expect, it, vi } from "vitest";
import { Evaluator } from "../index";

const ev = new Evaluator();

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

  it("format the same after the formatter cache drops its oldest entries", () => {
    const format = (digits: number, fraction: number) =>
      ev.eval(`(1).toLocaleString("en", { minimumIntegerDigits: ${digits}, minimumFractionDigits: ${fraction} })`);
    expect(format(3, 0)).toBe("001");
    for (let digits = 1; digits <= 21; digits++) {
      for (let fraction = 0; fraction <= 3; fraction++) format(digits, fraction);
    }
    expect(format(3, 0)).toBe("001");
    expect(format(2, 1)).toBe("01.0");
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
