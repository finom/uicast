import { describe, expect, it } from "vitest";
import { Evaluator, type EvaluatorContexts, ExpressionError, type StandardToolV0 } from "../index";
import { CORPUS, SCOPES } from "./corpus";

// Each protected method is one step a subclass can change or skip.

const numberOnly = {
  "~standard": {
    version: 1,
    vendor: "test",
    validate: (v: unknown) => (typeof v === "number" ? { value: v } : { issues: [{ message: "want a number" }] }),
  },
} as NonNullable<StandardToolV0["inputSchema"]>;

const double: StandardToolV0 = {
  name: "double",
  description: "",
  inputSchema: numberOnly,
  execute: (input) => (input as number) * 2,
};

const refuses = (ev: Evaluator, source: string, ...contexts: EvaluatorContexts): boolean => {
  try {
    ev.eval(source, ...contexts);
    return false;
  } catch (err) {
    return ExpressionError.is(err);
  }
};

describe("check", () => {
  class NoLocale extends Evaluator {
    protected override check(source: string) {
      super.check(source);
      if (source.includes("toLocale")) throw new ExpressionError("Locale methods are not allowed here");
    }
  }

  it("adds a rule on top of the language's", () => {
    const ev = new NoLocale();
    expect(() => ev.validate("(1).toLocaleString()")).toThrow(/not allowed here/);
    expect(refuses(ev, "new Date(0)")).toBe(true);
    expect(ev.eval("Date.parse('1970-01-01T00:00:00Z')")).toBe(0);
  });

  it("runs once per source", () => {
    let calls = 0;
    const ev = new (class extends Evaluator {
      protected override check(source: string) {
        calls++;
        super.check(source);
      }
    })();
    ev.eval("1 + 1");
    ev.validate("1 + 1");
    ev.memberReads("1 + 1", "scopes");
    expect(calls).toBe(1);
  });

  it("skipped, the facts are still collected", () => {
    const ev = new (class extends Evaluator {
      protected override check() {}
    })({ functions: [double] });
    expect(ev.validate("new Map([[a, double(b)]])")).toEqual({
      freeIds: ["Map", "a", "double", "b"],
      toolCalls: ["double"],
    });
    expect(ev.memberReads("scopes.root.x + scopes.item.y", "scopes")).toEqual(["scopes.root.x", "scopes.item.y"]);
  });

  it("skipped, the interpreter still runs under its membrane", () => {
    const ev = new (class extends Evaluator {
      protected override check() {}
    })();
    expect(refuses(ev, "new Date(0)")).toBe(true);
    expect(refuses(ev, "fetch")).toBe(true);
    expect(ev.eval("({}).constructor")).toBeUndefined();
  });
});

describe("resolveGlobal", () => {
  class WithRate extends Evaluator {
    protected override resolveGlobal(name: string) {
      return name === "RATE" ? 0.2 : super.resolveGlobal(name);
    }
  }

  it("adds a name", () => {
    expect(new WithRate().eval("100 * RATE")).toBe(20);
  });

  it("answers only for a name no context has", () => {
    expect(new WithRate().eval("RATE", { RATE: 1 })).toBe(1);
  });

  it("still refuses an unknown name through the default", () => {
    expect(() => new WithRate().eval("fetch")).toThrow(expect.objectContaining({ reason: "unknown-reference" }));
  });
});

describe("callHostFunction", () => {
  it("wraps every call", () => {
    const seen: unknown[] = [];
    const ev = new (class extends Evaluator {
      protected override callHostFunction(fn: StandardToolV0, input: unknown) {
        seen.push([fn.name, input]);
        return super.callHostFunction(fn, input);
      }
    })({ functions: [double] });
    expect(ev.eval("double(21)")).toBe(42);
    expect(() => ev.eval('double("x")')).toThrow(expect.objectContaining({ reason: "invalid-arguments" }));
    expect(seen).toEqual([
      ["double", 21],
      ["double", "x"],
    ]);
  });

  it("skips the data gate and the schemas", () => {
    const ev = new (class extends Evaluator {
      protected override callHostFunction(fn: StandardToolV0, input: unknown) {
        return fn.execute(input);
      }
    })({ functions: [double] });
    expect(ev.eval('double("21")')).toBe(42);
  });
});

describe("checkResult", () => {
  const ctx = { when: new Date(0) };

  it("is the exit gate by default", () => {
    expect(refuses(new Evaluator(), "when", ctx)).toBe(true);
  });

  it("skipped, any value leaves", () => {
    const ev = new (class extends Evaluator {
      protected override checkResult() {}
    })();
    expect(ev.eval("when", ctx)).toBe(ctx.when);
  });

  it("adds a rule", () => {
    const ev = new (class extends Evaluator {
      protected override checkResult(value: unknown) {
        super.checkResult(value);
        if (typeof value === "string" && value.length > 3) throw new ExpressionError("Too long for this slot");
      }
    })();
    expect(ev.eval('"abc"')).toBe("abc");
    expect(() => ev.eval('"abcd"')).toThrow(/Too long/);
  });
});

// Refused by the rules, by an unknown name, by the engine's own parse or by the exit gate — with toFunction set too.
const REFUSED = [
  "await 1",
  "[3,1,2].sort()",
  '"a".substr(0, 1)',
  "[1].entries()",
  "Math.random()",
  "[1].forEach(n => n)",
  "[1, , 2]",
  'String.raw({ raw: ["a"] })',
  "Object.assign({}, { a: 1 })",
  'encodeURI("a b")',
  "[1].map(() => { while (true) {} })",
  "[1].map(x => { let i = 0; return i })",
  "[1].map(function f(n) { return f(n) })",
  "(() => 1)()",
  "scopes.root.x = 1",
  "scopes.root.x++",
  "delete scopes.root.x",
  "(1, 2)",
  '/(a+)+$/.test("aa!")',
  'eval("1+1")',
  "arguments",
  'import("./x.js")',
  "String.raw`x`",
  "this",
  "({}) instanceof Object",
  "({ __proto__: { a: 1 } })",
  '"a" in ({ a: 1 })',
  "1 & 2",
  "({}).x?.()",
  "[].map.call",
  'fetch("/x")',
  "globalThis",
  'require("fs")',
  "setTimeout(() => 1, 0)",
  'new Function("return 1")',
  "Function",
  "Date()",
  "new Date(0)",
  "new Set([1])",
  "(a, b, c, d, e, f) => f",
  "1); (2",
  "1 +",
];

describe("toFunction", () => {
  class FunctionEvaluator extends Evaluator {
    protected override toFunction(names: readonly string[], body: string) {
      return new Function(...names, body);
    }
  }

  const ev = new FunctionEvaluator();
  const plainJs = (expr: string): unknown => new Function("scopes", `"use strict"; return (${expr})`)(SCOPES);

  describe("the corpus runs as plain JavaScript", () => {
    for (const expr of CORPUS) {
      it(expr, () => {
        expect(ev.eval(expr, { scopes: SCOPES })).toEqual(plainJs(expr));
      });
    }
  });

  it("keeps the language rules, the name lookup and the exit gate", () => {
    expect(refuses(ev, "new Date(0)")).toBe(true);
    expect(refuses(ev, "Math.random()")).toBe(true);
    expect(() => ev.eval("fetch")).toThrow(expect.objectContaining({ reason: "unknown-reference" }));
    expect(ev.eval("Math", { Math: 7 })).toBe(7);
    expect(refuses(ev, "scopes.fn", { scopes: { fn: () => 1 } })).toBe(true);
  });

  it("calls host functions through callHostFunction", () => {
    const withDouble = new FunctionEvaluator({ functions: [double] });
    expect(withDouble.eval("double(n)", { n: 21 })).toBe(42);
    expect(() => withDouble.eval('double("x")')).toThrow(expect.objectContaining({ reason: "invalid-arguments" }));
  });

  it("has no budget", () => {
    expect((ev.eval('"x".repeat(5000000)') as string).length).toBe(5_000_000);
  });

  it("reports what the engine refuses as a syntax error", () => {
    expect(() => ev.eval("eval")).toThrow(expect.objectContaining({ reason: "expression-syntax" }));
  });

  it("refuses what the language refuses", () => {
    for (const source of REFUSED) {
      expect(refuses(ev, source, { scopes: { root: { x: 0 } } }), source).toBe(true);
      expect(refuses(new Evaluator(), source, { scopes: { root: { x: 0 } } }), source).toBe(true);
    }
  });

  it("reaches whatever a name built at run time names, so it is for trusted sources only", () => {
    for (const [source, value] of [
      ['"abc"["sub" + "str"](1)', "bc"],
      ['[({}).constructor.constructor][0]("return 1 + 1")()', 2],
      ['Object["get" + "PrototypeOf"]([])', Array.prototype],
    ] as const) {
      expect(ev.eval(source), source).toBe(value);
      expect(refuses(new Evaluator(), source), source).toBe(true);
    }
  });

  it("classifies a runtime fault as the interpreter does", () => {
    for (const source of ["scopes.nothing.x", "(1).toFixed(101)", '"a".repeat(-1)', 'JSON.parse("{")']) {
      expect(() => ev.eval(source, { scopes: SCOPES }), source).toThrow(
        expect.objectContaining({ reason: "expression-runtime" }),
      );
    }
  });
});

describe("every step skipped", () => {
  class TrustedEvaluator extends Evaluator {
    protected override check() {}

    protected override resolveGlobal(name: string) {
      return (globalThis as Record<string, unknown>)[name];
    }

    protected override callHostFunction(fn: StandardToolV0, input: unknown) {
      return fn.execute(input);
    }

    protected override checkResult() {}

    protected override toFunction(names: readonly string[], body: string) {
      return new Function(...names, body);
    }
  }

  const ev = new TrustedEvaluator({ functions: [double], maxSourceLength: Number.POSITIVE_INFINITY });

  it("runs JavaScript outside the language", () => {
    expect(ev.eval("new Intl.NumberFormat('en-US').format(double(n * 1000))", { n: 1.5 })).toBe("3,000");
    expect(ev.eval("[1, 2].map(double)")).toEqual([2, 4]);
    expect(ev.eval("new Date(0)")).toEqual(new Date(0));
    expect(ev.eval('double("21")')).toBe(42);
  });

  it("still reads the contexts before the globals", () => {
    expect(ev.eval("Intl", { Intl: 1 })).toBe(1);
  });
});
