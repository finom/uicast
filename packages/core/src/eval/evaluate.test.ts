import { describe, expect, it } from "vitest";
import { evaluate, getScopeReads } from "./evaluate";

describe("evaluate — ValueExpr", () => {
  it("returns the literal when literal is set", () => {
    expect(evaluate({ literal: 42 }, {})).toBe(42);
    expect(evaluate({ literal: { a: 1 } }, {})).toEqual({ a: 1 });
    expect(evaluate({ literal: null }, {})).toBeNull();
  });

  it("prefers literal over expr when both are set", () => {
    expect(evaluate({ literal: 1, expr: "2" }, {})).toBe(1);
  });

  it("evaluates expr against the provided context", () => {
    expect(evaluate({ expr: "a + b" }, { a: 2, b: 3 })).toBe(5);
  });

  it("returns null when neither literal nor expr is set", () => {
    expect(evaluate({}, {})).toBeNull();
  });

  it("reads from a scopes-shaped context", () => {
    const context = {
      scopes: { root: { count: 7 } },
    };
    expect(evaluate({ expr: "scopes.root.count * 2" }, context)).toBe(14);
  });
});

describe("evaluate — error propagation", () => {
  it("throws on disallowed syntax", () => {
    expect(() => evaluate({ expr: "x = 1" }, { x: 0 })).toThrow();
  });

  it("propagates runtime errors from inside the expression", () => {
    expect(() => evaluate({ expr: "a.b.c" }, { a: null })).toThrow();
  });
});

describe("evaluate — host functions and evt", () => {
  it("exposes options.functions as bare identifiers", () => {
    const result = evaluate(
      { expr: "double(3)" },
      {},
      { functions: { double: (n: number) => n * 2 } },
    );
    expect(result).toBe(6);
  });

  it("exposes evt to callbacks", () => {
    const result = evaluate(
      { expr: "evt.value + 1" },
      { evt: { value: 10 } },
    );
    expect(result).toBe(11);
  });
});

describe("getScopeReads — thin wrapper around SafeEval.scopeReads", () => {
  it("returns paths read by an expression", () => {
    expect(getScopeReads("scopes.root.a + scopes.root.b")).toEqual(
      expect.arrayContaining(["scopes.root.a", "scopes.root.b"]),
    );
  });

  it("returns an empty list for a literal", () => {
    expect(getScopeReads("1 + 2")).toEqual([]);
  });
});
