import { describe, expect, it } from "vitest";
import { SafeEval, SafeEvalError } from "../safe-eval";

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

  it("allows safe statements nested inside arrow-function bodies", () => {
    // switch + break + local binding
    expect(
      evalr.eval(
        'xs.map(n => { let r; switch (n) { case 1: r = "a"; break; case 2: r = "b"; break; default: r = "z"; } return r; })',
        { xs: [1, 2, 3] },
      ),
    ).toEqual(["a", "b", "z"]);

    // C-style for with i++ (ForStatement + UpdateExpression)
    expect(
      evalr.eval(
        "(n => { let t = 0; for (let i = 0; i < n; i++) { t += i; } return t; })(4)",
      ),
    ).toBe(6);

    // for-of + continue
    expect(
      evalr.eval(
        "(arr => { let s = 0; for (const x of arr) { if (x % 2 === 0) continue; s += x; } return s; })(xs)",
        { xs: [1, 2, 3, 4] },
      ),
    ).toBe(4);

    // for-in
    expect(
      evalr.eval(
        '(o => { const keys = []; for (const k in o) { keys.push(k); } return keys.join(","); })({ a: 1, b: 2 })',
      ),
    ).toBe("a,b");

    // while + do-while
    expect(
      evalr.eval("(n => { let i = 0; while (i < n) { i++; } return i; })(3)"),
    ).toBe(3);
    expect(
      evalr.eval(
        "(n => { let i = 0; do { i++; } while (i < n); return i; })(3)",
      ),
    ).toBe(3);

    // try / catch / throw
    expect(
      evalr.eval(
        '(x => { try { if (!x) throw new Error("no"); return x; } catch { return -1; } })(0)',
      ),
    ).toBe(-1);
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
    // `Function` is shadowed to undefined, so `new Function(...)` throws at
    // runtime (TypeError) rather than failing AST validation.
    expect(() => evalr.eval("new Function('return 1')()")).toThrow();
  });

  it("rejects dynamic import(), even nested inside a callback body", () => {
    // import("…") is a valid *expression*, so it survives the `void (…)` parse
    // wrapper, and `import` is a keyword that global shadowing can't touch — it
    // has to be blocked structurally, everywhere (not just at the top level).
    expect(() => evalr.eval('import("evil")')).toThrow(SafeEvalError);
    expect(() =>
      evalr.eval('xs.map(() => import("evil"))', { xs: [1] }),
    ).toThrow(SafeEvalError);
  });

  it("rejects meta-properties (new.target) inside a callback body", () => {
    // `new.target` parses only inside a function, so it can't reach the top
    // level, but it must still be blocked where it can appear.
    expect(() =>
      evalr.eval("xs.map(function () { return new.target; })", { xs: [1] }),
    ).toThrow(SafeEvalError);
  });

  it("shadows ambient capability globals to undefined", () => {
    // Code-exec + exfiltration globals resolve to `undefined` inside an
    // expression, so any reference is inert.
    for (const g of ["fetch", "Image", "Audio", "WebAssembly", "Deno", "Bun"]) {
      expect(evalr.eval(`typeof ${g}`)).toBe("undefined");
    }
    // ...so the exfiltration / code-exec forms throw rather than run.
    expect(() => evalr.eval("new Image()")).toThrow();
    expect(() => evalr.eval("WebAssembly.instantiate(0)")).toThrow();
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

describe("SafeEval — function-expression bodies", () => {
  it("allows safe statements inside a function-expression body, like arrows", () => {
    expect(
      evalr.eval("xs.map(function (n) { const r = n * 2; return r; })", {
        xs: [1, 2, 3],
      }),
    ).toEqual([2, 4, 6]);
  });

  it("still blocks forbidden property access inside a function-expression body", () => {
    expect(() =>
      evalr.eval("xs.map(function (o) { return o.constructor; })", {
        xs: [{}],
      }),
    ).toThrow(SafeEvalError);
  });
});

describe("SafeEval — strict-mode validation", () => {
  it("rejects strict-only syntax (octal literal) as a SafeEvalError", () => {
    // Sloppy-legal, strict-illegal. Must surface as a SafeEvalError caught at
    // validate, not a raw SyntaxError leaking from `new Function` at compile.
    expect(() => evalr.validate("0777")).toThrow(SafeEvalError);
    expect(() => evalr.eval("0777")).toThrow(SafeEvalError);
  });

  it("rejects strict-only duplicate parameter names as a SafeEvalError", () => {
    expect(() => evalr.eval("(function (a, a) { return a; })(1, 2)")).toThrow(
      SafeEvalError,
    );
  });
});

describe("SafeEval — allowlist enforcement", () => {
  const strict = new SafeEval({
    allowGlobals: ["Math", "Date"],
    enforceAllowlist: true,
  });

  it("allows context names, allowed globals, and host functions", () => {
    expect(strict.eval("scopes.root.n + 1", { scopes: { root: { n: 4 } } })).toBe(
      5,
    );
    expect(strict.eval("Math.max(a, b)", { a: 1, b: 2 })).toBe(2);
    expect(
      strict.eval("greet(name)", { greet: (s: string) => `hi ${s}`, name: "Ada" }),
    ).toBe("hi Ada");
  });

  it("rejects an unknown free identifier before running", () => {
    expect(() => strict.eval("missing + 1", {})).toThrow(SafeEvalError);
    expect(() =>
      strict.eval("scopes.root.n + other", { scopes: { root: { n: 1 } } }),
    ).toThrow(/other/);
  });

  it("rejects a reachable global that isn't on the allowlist", () => {
    // `Set` is benign and not shadowed, but absent from this instance's globals.
    expect(() => strict.eval("new Set()")).toThrow(SafeEvalError);
  });

  it("treats params, destructuring, and local declarations as internal", () => {
    expect(
      strict.eval("xs.map(({ id, n }) => id + n)", { xs: [{ id: 1, n: 2 }] }),
    ).toEqual([3]);
    expect(strict.eval("xs.reduce((acc, x) => acc + x, 0)", { xs: [1, 2, 3] })).toBe(
      6,
    );
    expect(
      strict.eval("(n => { const t = n * 2; return t; })(arr.length)", {
        arr: [1, 2, 3],
      }),
    ).toBe(6);
    expect(strict.eval("xs.map((x, i = 0) => x + i)", { xs: [5] })).toEqual([5]);
  });

  it("flags a free identifier shadowed only in a sibling scope", () => {
    // `q` is a param of the first arrow but free in `[q]` — must be caught.
    expect(() => strict.eval("xs.map(q => q).concat([q])", { xs: [1] })).toThrow(
      /q/,
    );
  });

  it("accepts host-opted extra globals via the third arg", () => {
    expect(() => strict.eval("structuredClone(x)", { x: { a: 1 } })).toThrow(
      SafeEvalError,
    );
    expect(
      strict.eval("structuredClone(x)", { x: { a: 1 } }, ["structuredClone"]),
    ).toEqual({ a: 1 });
  });

  it("leaves enforcement off by default", () => {
    const loose = new SafeEval({ allowGlobals: ["Math"] });
    expect(loose.eval("new Set([1, 2, 2]).size")).toBe(2);
  });
});

describe("SafeEval — compilation memoization", () => {
  it("re-evaluates correctly across calls and context shapes", () => {
    const ev = new SafeEval();
    // Same context shape, different values → reuses the compiled function.
    expect(ev.eval("a + b", { a: 1, b: 2 })).toBe(3);
    expect(ev.eval("a + b", { a: 10, b: 20 })).toBe(30);
    // Different key order → distinct signature, still correct.
    expect(ev.eval("a + b", { b: 5, a: 100 })).toBe(105);
    // Different key set entirely → distinct signature, still correct.
    expect(ev.eval("a + b", { a: 7, b: 8, c: 9 })).toBe(15);
  });

  it("clearCache forces recompilation without changing results", () => {
    const ev = new SafeEval();
    expect(ev.eval("n * 2", { n: 21 })).toBe(42);
    ev.clearCache();
    expect(ev.eval("n * 2", { n: 21 })).toBe(42);
  });
});
