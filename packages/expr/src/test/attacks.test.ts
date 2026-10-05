import { describe, expect, it, vi } from "vitest";
import { Evaluator, ExpressionError, type StandardToolV0 } from "../index";

const ev = new Evaluator();

const attempt = (expr: string, context: Record<string, unknown> = {}) => {
  try {
    const value = ev.eval(expr, context);
    return { blocked: false as const, value };
  } catch (err) {
    return {
      blocked: true as const,
      reason: err instanceof ExpressionError ? err.reason : "not-an-expression-error",
      message: (err as Error).message,
    };
  }
};

const mustBlock = (expr: string, context?: Record<string, unknown>) => {
  const result = attempt(expr, context);
  expect(result, `EXPECTED BLOCK: ${expr}`).toMatchObject({ blocked: true });
};

// Refused, or `undefined`: a plain object has no readable inherited member, so a prototype name is simply absent.
const mustNotReach = (expr: string) => {
  const result = attempt(expr);
  if (!result.blocked) expect(result.value, `EXPECTED NOTHING: ${expr}`).toBeUndefined();
};

describe("reaching the Function constructor", () => {
  it("no spelling of the documented escape reaches anything", () => {
    for (const expr of [
      `({}).constructor`,
      `({})["constructor"]`,
      `({})["con"+"structor"]`,
      `({})["con"+"structor"]["con"+"structor"]("return 1+41")()`,
      `[].constructor`,
      `[]["con"+"structor"]`,
      `"".constructor`,
      `(0).constructor`,
      `(true).constructor`,
      `(x => x).constructor`,
      `({}).__proto__`,
      `({})["__pro"+"to__"]`,
      `({}).__proto__.constructor`,
      `[].__proto__`,
      `({}).constructor.prototype`,
      // The key assembled so no substring of the source spells it.
      `({})[["con","str","uctor"].join("")]`,
      `({})[String.fromCharCode(99,111,110,115,116,114,117,99,116,111,114)]`,
    ]) {
      mustNotReach(expr);
    }
  });

  it("blocks reaching the prototype graph through an allow-listed namespace", () => {
    for (const expr of [
      `Object.getPrototypeOf([])`,
      `Object.getPrototypeOf(Object.getPrototypeOf([]))`,
      `Object["getPrototypeOf"]([])`,
      `Object["get"+"PrototypeOf"]([])`,
      `Object.defineProperty({}, "x", {})`,
      `Object.setPrototypeOf({}, null)`,
      `Object.getOwnPropertyNames([])`,
      `Object.assign({}, {})`,
      `Object.create(null)`,
      `Math.constructor`,
      `Math["con"+"structor"]`,
      `JSON.constructor`,
      `JSON.parse.constructor`,
      `Array.prototype`,
      `Array.from.constructor`,
    ]) {
      mustBlock(expr);
    }
  });

  it("blocks re-binding a receiver", () => {
    for (const expr of [
      `[].map.call`,
      `[].slice.bind`,
      `"".at.apply`,
      `({}).valueOf.call({})`,
      `[]["ca"+"ll"]`,
      `[].sort["ca"+"ll"]`,
    ]) {
      mustBlock(expr);
    }
  });

  it("does not let a method be read as a value at all", () => {
    for (const expr of [`[].map`, `"".slice`, `[1,2].filter`, `Math.max`, `JSON.parse`]) {
      mustBlock(expr);
    }
    expect(ev.eval(`[1,2,3].filter(n => n > 1)`)).toEqual([2, 3]);
    expect(ev.eval(`Math.max(1, 5, 3)`)).toBe(5);
  });
});

describe("prototype pollution", () => {
  const ownKeyOnly = (value: unknown) => {
    expect(Object.getPrototypeOf(value)).toBe(Object.prototype);
    expect(Object.hasOwn(value as object, "__proto__")).toBe(true);
  };

  it("the written literal form is refused as syntax; a computed key is an own property", () => {
    mustBlock(`({ __proto__: { pwned: 1 } })`);
    ownKeyOnly(ev.eval(`({ ["__pro"+"to__"]: { pwned: 1 } })`));
    ownKeyOnly(ev.eval(`({ ["__proto__"]: { pwned: 1 } })`));
    ownKeyOnly(ev.eval(`({ [\`__proto__\`]: { pwned: 1 } })`));
    expect(ev.eval(`({ ["constructor"]: 1 })`)).toEqual({ constructor: 1 });
    expect(({} as Record<string, unknown>).pwned).toBeUndefined();
  });

  it("Object.fromEntries defines own properties", () => {
    ownKeyOnly(ev.eval(`Object.fromEntries([["__proto__", { pwned2: 1 }]])`));
    expect(ev.eval(`Object.fromEntries([["con"+"structor", 1]])`)).toEqual({ constructor: 1 });
    expect(({} as Record<string, unknown>).pwned2).toBeUndefined();
  });

  it("a spread copies an own `__proto__` key as an own key", () => {
    ownKeyOnly(ev.eval(`({ ...scopes.evil })`, { scopes: { evil: JSON.parse('{"__proto__": {"pwned3": 1}}') } }));
    expect(({} as Record<string, unknown>).pwned3).toBeUndefined();
  });

  it("leaves Object.prototype untouched after the whole suite", () => {
    expect(Object.keys(Object.prototype)).toEqual([]);
  });
});

describe("denial of service", () => {
  it("has no loop syntax to write", () => {
    mustBlock(`[1].map(() => { while (true) {} })`);
    mustBlock(`[1].map(() => { for (;;) {} })`);
    mustBlock(`[1].map(x => { let i = 0; return i })`);
    mustBlock(`(() => { while(true){} })()`);
  });

  it("cannot name a function to recurse through", () => {
    mustBlock(`[1].map(function f(n) { return f(n) })`);
    mustBlock(`(function f(){ return f() })()`);
    mustBlock(`(f => f(f))(f => f(f))`);
  });

  it("cannot put a function where it could be called again", () => {
    for (const expr of [
      `[f => f(f)].map(f => f(f)).length`,
      `[(v, i, a) => a.map(a[0])].map((v, i, a) => a.map(a[0]))`,
      `({ f: x => x }).f(1)`,
    ]) {
      expect(attempt(expr), expr).toMatchObject({ blocked: true, reason: "guardrail-violation" });
    }
  });

  it("caps string allocation", () => {
    mustBlock(`"x".repeat(1e9)`);
    mustBlock(`"x".repeat(2000000)`);
    mustBlock(`"x".padStart(1e9, "y")`);
    mustBlock(`"abcdefghij".repeat(100000).repeat(100)`);
  });

  it("caps array allocation", () => {
    mustBlock(`Array.from({ length: 1e9 })`);
    mustBlock(`Array.from({ length: 500000 })`);
    mustBlock(`[1,2,3].flatMap(() => Array.from({ length: 1e9 }))`);
  });

  it("spends a step budget on iteration", () => {
    const rows = Array.from({ length: 5_000 }, (_, i) => i);
    expect(ev.eval("scopes.rows.map(n => n + 1).length", { scopes: { rows } })).toBe(5_000);
    const tight = new Evaluator({ budget: { steps: 2_000 } });
    let blocked = false;
    try {
      tight.eval("scopes.rows.map(n => n + 1).length", { scopes: { rows } });
    } catch (err) {
      blocked = err instanceof ExpressionError && err.reason === "budget-exceeded";
    }
    expect(blocked).toBe(true);
  });

  it("caps allocation across the whole evaluation, not just per operation", () => {
    const rows = Array.from({ length: 5000 }, (_, i) => i);
    const result = attempt("scopes.rows.map(x => scopes.rows.slice()).length", {
      scopes: { rows },
    });
    expect(result).toMatchObject({ blocked: true, reason: "budget-exceeded" });

    expect(ev.eval("scopes.rows.filter(n => n % 2 === 0).length", { scopes: { rows } })).toBe(2500);
  });

  it("has no regular expressions, so ReDoS has nowhere to live", () => {
    mustBlock(`/(a+)+$/.test("aaaaaaaaaaaaaaaaaaaaaaaaaaa!")`);
    mustBlock(`"aaa".replace(/a/g, "b")`);
    mustBlock(`"aaa".match(/a/)`);
    mustBlock(`new RegExp("(a+)+$")`);
    mustBlock(`RegExp("x")`);
  });

  it("caps nesting depth so the compiler cannot blow its own stack", () => {
    // Parentheses are folded by the parser and create no nodes, so nesting has
    // to come from real ones.
    mustBlock(`${"[".repeat(300)}1${"]".repeat(300)}`);
    mustBlock(`${"!".repeat(300)}true`);
    mustBlock(`${"1 + (".repeat(200)}1${")".repeat(200)}`);
  });
});

describe("walking a live object graph", () => {
  class Sneaky {
    secret = "s3cret";
  }

  it("refuses to read anything that is not plain data", () => {
    // The shape of the classic DOM escape: every key in the path is innocent.
    const fakeEvent = {
      target: Object.assign(Object.create({ marker: 1 }), {
        ownerDocument: { defaultView: { fetch: () => {} } },
      }),
    };
    mustBlock(`evt.target.ownerDocument.defaultView`, { evt: fakeEvent });
    mustBlock(`scopes.instance.secret`, { scopes: { instance: new Sneaky() } });
    mustBlock(`scopes.fn`, { scopes: { fn: () => 1 } });
    mustBlock(`scopes.fn()`, { scopes: { fn: () => 1 } });
    mustBlock(`scopes.re.source`, { scopes: { re: /x/ } });
  });

  it("reads plain data through the same path happily", () => {
    const plain = { target: { ownerDocument: { title: "ok" } } };
    expect(ev.eval(`evt.target.ownerDocument.title`, { evt: plain })).toBe("ok");
  });

  it("never walks a prototype chain, named or not", () => {
    const withProto = Object.assign(Object.create({ inherited: "leak" }), { own: "fine" });
    mustBlock(`scopes.o.inherited`, { scopes: { o: withProto } });
    expect(ev.eval(`scopes.o.toString`, { scopes: { o: { a: 1 } } })).toBeUndefined();
    expect(ev.eval(`scopes.o.hasOwnProperty`, { scopes: { o: { a: 1 } } })).toBeUndefined();
    expect(ev.eval(`scopes.o.valueOf`, { scopes: { o: { a: 1 } } })).toBeUndefined();
  });

  it("rejects a symbol as a property key", () => {
    mustBlock(`scopes.o[scopes.sym]`, { scopes: { o: {}, sym: Symbol("x") } });
  });

  it("refuses a raw function value on every read path", () => {
    const fn = () => 1;
    mustBlock(`scopes.o.fn`, { scopes: { o: { fn } } });
    mustBlock(`scopes.arr[0]`, { scopes: { arr: [fn] } });
    mustBlock(`scopes.arr.at(0)`, { scopes: { arr: [fn] } });
    mustBlock(`scopes.m.get("f")`, { scopes: { m: new Map([["f", fn]]) } });
  });
});

describe("code loading and escape hatches", () => {
  it("blocks every route to loading or naming code", () => {
    for (const expr of [
      `import("./evil.js")`,
      `import.meta.url`,
      `eval("1+1")`,
      `arguments`,
      `new Function("return 1")`,
      `Function("return 1")`,
      `globalThis`,
      `window`,
      `self`,
      `global`,
      `process`,
      `require("fs")`,
      `fetch("/x")`,
      `setTimeout(() => 1, 0)`,
      `document`,
      `localStorage`,
      `new Image()`,
      `WebAssembly`,
      `Reflect`,
      `Proxy`,
      `Symbol`,
      `BigInt(1)`,
      `String.raw\`x\``,
      `new.target`,
      `this`,
    ]) {
      mustBlock(expr);
    }
  });

  it("blocks writes, deletes, and sequencing", () => {
    for (const expr of [
      `scopes.root.x = 1`,
      `scopes.root.x += 1`,
      `scopes.root.x++`,
      `delete scopes.root.x`,
      `void 0`,
      `(1, 2)`,
      `[1].map(x => scopes.root.x = 1)`,
      `({}) instanceof Object`,
    ]) {
      mustBlock(expr, { scopes: { root: { x: 0 } } });
    }
  });

  it("blocks breaking out of the expression wrapper", () => {
    for (const expr of [`1); (2`, `1)); ((2`, `1} ; {`]) {
      mustBlock(expr);
    }
  });
});

describe("what a rejection looks like", () => {
  it("is always an ExpressionError with a classified reason", () => {
    expect(attempt(`[].constructor`)).toMatchObject({ reason: "guardrail-violation" });
    expect(attempt(`nope()`)).toMatchObject({ reason: "unknown-reference" });
    expect(attempt(`1 +`)).toMatchObject({ reason: "expression-syntax" });
    expect(attempt(`"x".repeat(1e9)`)).toMatchObject({ reason: "budget-exceeded" });
    // Native coercion inside an operator.
    const odd = { toString: "x" };
    expect(attempt(`x + ""`, { x: odd })).toMatchObject({ reason: "expression-runtime" });
    expect(attempt(`x < 1`, { x: odd })).toMatchObject({ reason: "expression-runtime" });
    expect(attempt("`${" + "x}`", { x: odd })).toMatchObject({ reason: "expression-runtime" });
  });

  it("classifies host-function failures apart from the language's own", () => {
    const schema = {
      "~standard": {
        version: 1,
        vendor: "test",
        validate: (v: unknown) => (typeof v === "number" ? { value: v } : { issues: [{ message: "want a number" }] }),
        jsonSchema: () => ({ type: "number" }),
      },
    } as unknown as NonNullable<StandardToolV0["inputSchema"]>;
    const ev = new Evaluator({
      functions: [
        { name: "f", description: "", inputSchema: schema, execute: (i: unknown) => i },
        {
          name: "boom",
          description: "",
          execute: () => {
            throw new Error("down");
          },
        },
      ],
    });
    const attemptWith = (expr: string) => {
      try {
        ev.eval(expr);
      } catch (err) {
        return err as ExpressionError;
      }
      return null;
    };
    expect(attemptWith(`f("x")`)).toMatchObject({ reason: "invalid-arguments" });
    expect(attemptWith(`boom()`)).toMatchObject({ reason: "host-function" });
  });

  it("refuses a host function used as a value, before anything runs", () => {
    const ev = new Evaluator({
      functions: [{ name: "f", description: "", execute: () => 1 }],
    });
    expect(() => ev.validate(`[f]`)).toThrow(/can only be called/);
    expect(() => ev.validate(`f(1, 2)`)).toThrow(/single argument/);
  });

  it("names the offending thing so a repair prompt can act on it", () => {
    const result = attempt(`[].constructor`);
    expect(result.blocked && result.message).toContain("constructor");
  });
});

describe("single operations the step counter could not see", () => {
  const exceeded = expect.objectContaining({ reason: "budget-exceeded" });
  it("a BigInt literal is refused before it runs", () => {
    expect(() => new Evaluator().eval("7n ** 300000000n > 0n")).toThrow(/BigInt/);
  });
  it("a search is charged the text's length times the pattern's: the engine can compare that much", () => {
    const s = "a".repeat(100_000);
    expect(() => new Evaluator({ budget: { steps: 1000 } }).eval("s.lastIndexOf('b')", { s })).toThrow(exceeded);
    // V8 takes over a second on each of these.
    const ev = new Evaluator();
    const context = { s: "a".repeat(1_000_000), t: `ab${"a".repeat(5_000)}` };
    for (const expr of [
      "s.includes(t)",
      "s.indexOf(t)",
      "s.lastIndexOf(t)",
      "s.split(t)",
      "s.replace(t, '')",
      "s.replaceAll(t, '')",
    ]) {
      expect(() => ev.eval(expr, context), expr).toThrow(exceeded);
    }
    const rows = Array.from({ length: 1_000 }, (_, i) => `${"word ".repeat(40)}${i}`);
    expect(ev.eval("rows.filter(r => r.includes('word 999')).length", { rows })).toBe(1);
  });
  it("normalize and localeCompare refuse more than 30 combining marks in a row: the engine orders a run in time of its square", () => {
    const ev = new Evaluator();
    const s = `a${"\u0301".repeat(30)}`;
    expect(ev.eval("s.normalize('NFD')", { s })).toBe(s.normalize("NFD"));
    expect(ev.eval("s.localeCompare('a')", { s })).toBe(s.localeCompare("a"));
    for (const expr of [
      "('a' + '\u0301'.repeat(40000)).normalize()",
      "(s + '\u0301').normalize('NFKC')",
      "(s + '\u0301').localeCompare('a')",
      "'a'.localeCompare(s + '\u0301', 'en')",
    ]) {
      expect(() => ev.eval(expr, { s }), expr).toThrow(exceeded);
    }
  });
  it("replaceAll is charged by its output", () => {
    expect(() => new Evaluator().eval("'a'.repeat(100000).replaceAll('a', 'b'.repeat(1000)).length")).toThrow(exceeded);
  });
  it("join and JSON.stringify are charged before the string exists", () => {
    // Built, each would pass the engine's own string limit and throw its RangeError instead.
    const a = Array.from({ length: 1_000 }, () => "x".repeat(1_000_000));
    const ev = new Evaluator();
    for (const expr of [
      "a.join('')",
      "a.toString()",
      "a + ''",
      // biome-ignore lint/suspicious/noTemplateCurlyInString: the string IS the expression under test
      "`${a}`",
      "String(a)",
      "[a].toSorted()",
      "JSON.stringify(a)",
      "JSON.stringify([a], null, 2)",
      "a.toLocaleString()",
      "(5).toLocaleString(a)",
    ]) {
      expect(() => ev.eval(expr, { a }), expr).toThrow(exceeded);
    }
    expect(ev.eval("[1, [2, 3]].join('-')")).toBe("1-2,3");
    expect(ev.eval("JSON.stringify({ a: [1, { b: 's' }] }, null, 2)")).toBe(
      JSON.stringify({ a: [1, { b: "s" }] }, null, 2),
    );
  });
  it("JSON.stringify counts escapes, so an oversized result is refused before the engine builds it", () => {
    const ev = new Evaluator();
    const stringify = vi.spyOn(JSON, "stringify");
    try {
      for (const s of ['"'.repeat(600_000), "\u0001".repeat(200_000), "\ud800".repeat(200_000)]) {
        expect(() => ev.eval("JSON.stringify(s)", { s })).toThrow(exceeded);
      }
      expect(stringify).not.toHaveBeenCalled();
    } finally {
      stringify.mockRestore();
    }
    expect(ev.eval("JSON.stringify(s).length", { s: "😀".repeat(400_000) })).toBe(800_002);
  });
  it("a conversion is charged by what it reads: a string parses, an array joins", () => {
    const s = "1".repeat(100_000);
    const big = Array.from({ length: 30_000 }, (_, i) => i);
    const ev = new Evaluator();
    for (const expr of [
      "Array.from({ length: 1000 }, () => +s)",
      "Array.from({ length: 1000 }, () => s - 1)",
      "Array.from({ length: 1000 }, () => s < 1)",
      "Array.from({ length: 1000 }, () => s == 1)",
      "Array.from({ length: 1000 }, () => Number(s))",
      "Array.from({ length: 1000 }, () => [].at(s))",
      "Array.from({ length: 1000 }, () => Date.parse(s))",
      "Array.from({ length: 1000 }, () => Math.max(big))",
      "Array.from({ length: 1000 }, () => big + '')",
      "Array.from({ length: 1000 }, () => 'x'.includes(big))",
      "Array.from({ length: 1000 }, () => big).toSorted().length",
    ]) {
      expect(() => ev.eval(expr, { s, big }), expr).toThrow(exceeded);
    }
  });
  it("a locale list is charged per tag, before the engine reads it", () => {
    const tags = Array.from({ length: 1_000 }, () => "en-US");
    const ev = new Evaluator();
    for (const expr of [
      "(5).toLocaleString(tags)",
      "(5)[k](tags)",
      "'a'.localeCompare('b', tags)",
      "(5)['toLocaleString'](...[tags, { style: 'percent' }])",
    ]) {
      expect(() => ev.eval(expr, { tags, k: "toLocaleString" }), expr).toThrow(exceeded);
    }
  });
  it("the engine reads only plain locales and options", () => {
    const ev = new Evaluator();
    for (const [expr, value] of [
      ["(5).toLocaleString(x)", { length: 1e9 }],
      ["(5).toLocaleString(x)", [{ toString: () => "en" }]],
      ["(5).toLocaleString('en', x)", { style: { toString: () => "percent" } }],
      ["(5).toLocaleString('en', x)", null],
    ] as const) {
      expect(() => ev.eval(expr, { x: value }), expr).toThrow(ExpressionError);
    }
  });
  it("flat is charged as it grows", () => {
    const big = Array.from({ length: 100_000 }, (_, i) => i);
    const nested = Array.from({ length: 20 }, () => Array.from({ length: 20 }, () => big));
    expect(() => new Evaluator().eval("nested.flat(2).length", { nested })).toThrow(exceeded);
  });
  it("replace is charged for what a `$'` replacement can expand to", () => {
    expect(() => new Evaluator().eval(`"x".repeat(100000).replace("x", "$'".repeat(100)).length`)).toThrow(exceeded);
    expect(() => new Evaluator().eval(`"x".repeat(20000).replaceAll("x", "$'").length`)).toThrow(exceeded);
    expect(new Evaluator().eval(`"abc".replace("b", "$'")`)).toBe("acc");
  });
  it("normalize and toUpperCase are charged by their output, which can be larger than the input", () => {
    expect(() => new Evaluator().eval(`"\uFDFA".repeat(60000).normalize("NFKD").length`)).toThrow(exceeded);
    expect(() => new Evaluator({ budget: { maxStringLength: 5 } }).eval(`"ßßß".toUpperCase()`)).toThrow(exceeded);
  });
  it("split is charged before the array exists", () => {
    const ev = new Evaluator({ budget: { maxArrayLength: 10 } });
    expect(() => ev.eval(`"x".repeat(1000).split("")`)).toThrow(exceeded);
    expect(ev.eval(`"a,b".split(",")`)).toEqual(["a", "b"]);
  });
  it("a NaN size does not disable the total allocation cap", () => {
    const ev = new Evaluator({ budget: { maxTotalAllocation: 100 } });
    expect(() => ev.eval(`["a".padStart("x"), "b".repeat(200)]`)).toThrow(exceeded);
  });
});
