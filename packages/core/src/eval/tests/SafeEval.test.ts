import { describe, expect, it } from "vitest";
import { SafeEval, SafeEvalError } from "../SafeEval";

const evalr = new SafeEval();

describe("SafeEval — allowed expressions", () => {
  it("evaluates arithmetic and comparison", () => {
    expect(evalr.eval("1 + 2 * 3")).toBe(7);
    expect(evalr.eval("5 > 3 && 2 < 4")).toBe(true);
    expect(evalr.eval("1 === '1'")).toBe(false);
  });

  it("reads context variables", () => {
    expect(evalr.eval("count + 1", { count: 41 })).toBe(42);
    expect(evalr.eval("user.name", { user: { name: "Ada" } })).toBe("Ada");
  });

  it("supports optional chaining and nullish coalescing", () => {
    expect(evalr.eval("user?.name ?? 'anon'", { user: null })).toBe("anon");
    expect(evalr.eval("arr?.[0]", { arr: [10, 20] })).toBe(10);
  });

  it("supports ternary, spread, and template literals", () => {
    expect(evalr.eval("flag ? 'on' : 'off'", { flag: true })).toBe("on");
    expect(evalr.eval("[...a, 4]", { a: [1, 2, 3] })).toEqual([1, 2, 3, 4]);
    expect(evalr.eval("`hi ${name}`", { name: "Ada" })).toBe("hi Ada");
  });

  it("supports array methods including arrow callbacks", () => {
    expect(
      evalr.eval("nums.filter(n => n > 2).map(n => n * 10)", {
        nums: [1, 2, 3, 4],
      }),
    ).toEqual([30, 40]);
    expect(
      evalr.eval("nums.reduce((s, n) => s + n, 0)", { nums: [1, 2, 3] }),
    ).toBe(6);
  });

  it("supports object literals when wrapped in parens", () => {
    expect(evalr.eval("({ a: 1, b: 2 })")).toEqual({ a: 1, b: 2 });
  });

  it("supports safe constructors with `new`", () => {
    const d = evalr.eval("new Date(2026, 0, 1)") as Date;
    expect(d).toBeInstanceOf(Date);
    expect((d as Date).getFullYear()).toBe(2026);
  });
});

describe("SafeEval — disallowed expressions", () => {
  it("rejects assignments", () => {
    expect(() => evalr.eval("x = 1", { x: 0 })).toThrow(SafeEvalError);
    expect(() => evalr.eval("x += 1", { x: 0 })).toThrow(SafeEvalError);
  });

  it("rejects update expressions", () => {
    expect(() => evalr.eval("x++", { x: 0 })).toThrow(SafeEvalError);
    expect(() => evalr.eval("--x", { x: 0 })).toThrow(SafeEvalError);
  });

  it("rejects the eval identifier", () => {
    expect(() => evalr.eval("eval('1+1')")).toThrow(SafeEvalError);
  });

  it("rejects new Function(...)", () => {
    expect(() => evalr.eval("new Function('return 1')()")).toThrow(
      SafeEvalError,
    );
  });

  it("rejects throw, while, for, if at statement level", () => {
    expect(() => evalr.eval("throw new Error('x')")).toThrow(SafeEvalError);
    expect(() => evalr.eval("while(true) 1")).toThrow(SafeEvalError);
    expect(() => evalr.eval("for(let i=0;i<1;i++) i")).toThrow(SafeEvalError);
  });

  it("rejects access to constructor / __proto__ / prototype", () => {
    expect(() => evalr.eval("obj.constructor", { obj: {} })).toThrow(
      SafeEvalError,
    );
    expect(() => evalr.eval("obj.__proto__", { obj: {} })).toThrow(
      SafeEvalError,
    );
    expect(() => evalr.eval('obj["constructor"]', { obj: {} })).toThrow(
      SafeEvalError,
    );
  });

  it("rejects multi-statement expressions", () => {
    expect(() => evalr.eval("1; 2")).toThrow(SafeEvalError);
  });

  it("rejects empty input", () => {
    expect(() => evalr.eval("")).toThrow(SafeEvalError);
    expect(() => evalr.eval("   ")).toThrow(SafeEvalError);
  });
});

describe("SafeEval.validate — analysis without execution", () => {
  it("flags async expressions", () => {
    expect(evalr.validate("await fetchUser()").isAsync).toBe(true);
    expect(evalr.validate("1 + 1").isAsync).toBe(false);
  });

  it("reports scopeReads", () => {
    expect(evalr.validate("scopes.root.count").scopeReads).toEqual([
      "scopes.root.count",
    ]);
  });
});
