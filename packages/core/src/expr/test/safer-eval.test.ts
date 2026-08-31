import { describe, expect, it } from "vitest";
import { EntryError } from "../../entry-error";
import { evaluate } from "../evaluate";
import { SaferEval, SaferEvalError } from "../safer-eval";

const evalr = new SaferEval();

describe("SaferEval — allowed expressions", () => {
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
    // biome-ignore lint/suspicious/noTemplateCurlyInString: the ${} lives inside a template literal fed to the sandbox — that is the case under test
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
        "ns.map(n => { let t = 0; for (let i = 0; i < n; i++) { t += i; } return t; })",
        { ns: [4] },
      ),
    ).toEqual([6]);

    // for-of + continue
    expect(
      evalr.eval(
        "[xs].map(arr => { let s = 0; for (const x of arr) { if (x % 2 === 0) continue; s += x; } return s; })",
        { xs: [1, 2, 3, 4] },
      ),
    ).toEqual([4]);

    // for-in
    expect(
      evalr.eval(
        '[{ a: 1, b: 2 }].map(o => { const keys = []; for (const k in o) { keys.push(k); } return keys.join(","); })',
      ),
    ).toEqual(["a,b"]);

    // while + do-while
    expect(
      evalr.eval("[3].map(n => { let i = 0; while (i < n) { i++; } return i; })"),
    ).toEqual([3]);
    expect(
      evalr.eval(
        "[3].map(n => { let i = 0; do { i++; } while (i < n); return i; })",
      ),
    ).toEqual([3]);

    // try / catch / throw
    expect(
      evalr.eval(
        '[0].map(x => { try { if (!x) throw new Error("no"); return x; } catch { return -1; } })',
      ),
    ).toEqual([-1]);
  });
});

describe("SaferEval — disallowed expressions", () => {
  it("rejects assignments", () => {
    expect(() => evalr.eval("x = 1", { x: 0 })).toThrow(SaferEvalError);
    expect(() => evalr.eval("x += 1", { x: 0 })).toThrow(SaferEvalError);
  });

  it("rejects update expressions", () => {
    expect(() => evalr.eval("x++", { x: 0 })).toThrow(SaferEvalError);
    expect(() => evalr.eval("--x", { x: 0 })).toThrow(SaferEvalError);
  });

  it("rejects the eval identifier", () => {
    expect(() => evalr.eval("eval('1+1')")).toThrow(SaferEvalError);
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
    expect(() => evalr.eval('import("evil")')).toThrow(SaferEvalError);
    expect(() =>
      evalr.eval('xs.map(() => import("evil"))', { xs: [1] }),
    ).toThrow(SaferEvalError);
  });

  it("rejects meta-properties (new.target) inside a callback body", () => {
    // `new.target` parses only inside a function, so it can't reach the top
    // level, but it must still be blocked where it can appear.
    expect(() =>
      evalr.eval("xs.map(function () { return new.target; })", { xs: [1] }),
    ).toThrow(SaferEvalError);
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
    expect(() => evalr.eval("throw new Error('x')")).toThrow(SaferEvalError);
    expect(() => evalr.eval("while(true) 1")).toThrow(SaferEvalError);
    expect(() => evalr.eval("for(let i=0;i<1;i++) i")).toThrow(SaferEvalError);
    expect(() => evalr.eval("if (true) 1")).toThrow(SaferEvalError);
  });

  it("rejects `arguments` inside a function body", () => {
    // `arguments` can't be shadowed as a strict-mode param — it's blocked as a
    // reference instead.
    expect(() =>
      evalr.eval("xs.map(function () { return arguments })", { xs: [1] }),
    ).toThrow(SaferEvalError);
  });

  it("rejects access to constructor / __proto__ / prototype", () => {
    expect(() => evalr.eval("obj.constructor", { obj: {} })).toThrow(
      SaferEvalError,
    );
    expect(() => evalr.eval("obj.__proto__", { obj: {} })).toThrow(
      SaferEvalError,
    );
    expect(() => evalr.eval('obj["constructor"]', { obj: {} })).toThrow(
      SaferEvalError,
    );
  });

  it("rejects multi-statement expressions", () => {
    expect(() => evalr.eval("1; 2")).toThrow(SaferEvalError);
  });

  it("rejects empty input", () => {
    expect(() => evalr.eval("")).toThrow(SaferEvalError);
    expect(() => evalr.eval("   ")).toThrow(SaferEvalError);
  });
});

describe("SaferEval.validate — analysis without execution", () => {
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

describe("SaferEval — function-expression bodies", () => {
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
    ).toThrow(SaferEvalError);
  });
});

describe("SaferEval — strict-mode validation", () => {
  it("rejects strict-only syntax (octal literal) as a SaferEvalError", () => {
    // Sloppy-legal, strict-illegal. Must surface as a SaferEvalError caught at
    // validate, not a raw SyntaxError leaking from `new Function` at compile.
    expect(() => evalr.validate("0777")).toThrow(SaferEvalError);
    expect(() => evalr.eval("0777")).toThrow(SaferEvalError);
  });

  it("rejects strict-only duplicate parameter names as a SaferEvalError", () => {
    expect(() => evalr.eval("(function (a, a) { return a; })(1, 2)")).toThrow(
      SaferEvalError,
    );
  });
});

describe("SaferEval — allowlist enforcement", () => {
  const strict = new SaferEval({
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
    expect(() => strict.eval("missing + 1", {})).toThrow(SaferEvalError);
    expect(() =>
      strict.eval("scopes.root.n + other", { scopes: { root: { n: 1 } } }),
    ).toThrow(/other/);
  });

  it("rejects a reachable global that isn't on the allowlist", () => {
    // `Set` is benign and not shadowed, but absent from this instance's globals.
    expect(() => strict.eval("new Set()")).toThrow(SaferEvalError);
  });

  it("treats params, destructuring, and local declarations as internal", () => {
    expect(
      strict.eval("xs.map(({ id, n }) => id + n)", { xs: [{ id: 1, n: 2 }] }),
    ).toEqual([3]);
    expect(strict.eval("xs.reduce((acc, x) => acc + x, 0)", { xs: [1, 2, 3] })).toBe(
      6,
    );
    expect(
      strict.eval("[arr.length].map(n => { const t = n * 2; return t; })", {
        arr: [1, 2, 3],
      }),
    ).toEqual([6]);
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
      SaferEvalError,
    );
    expect(
      strict.eval("structuredClone(x)", { x: { a: 1 } }, ["structuredClone"]),
    ).toEqual({ a: 1 });
  });

  it("leaves enforcement off by default", () => {
    const loose = new SaferEval({ allowGlobals: ["Math"] });
    expect(loose.eval("new Set([1, 2, 2]).size")).toBe(2);
  });
});

describe("SaferEval — writes to injected state", () => {
  const ctx = { scopes: { root: { hits: 1, rows: [{ qty: 1 }] } }, evt: { value: "x" } };

  // A function body makes assignment legal; it does not make assignment *to
  // `scopes`* legal. Every one of these is a write during evaluation.
  it.each([
    ["top level", "scopes.root.hits = 1"],
    ["inside a callback body", "scopes.root.rows.map(r => { scopes.root.hits = 2; return r })"],
    ["compound assignment", "scopes.root.rows.map(r => { scopes.root.hits += 1; return r })"],
    ["update expression", "scopes.root.rows.map(r => { scopes.root.hits++; return r })"],
    ["delete", "scopes.root.rows.map(r => { delete scopes.root.hits; return r })"],
    ["array destructuring", "scopes.root.rows.map(r => { [scopes.root.hits] = [2]; return r })"],
    ["object destructuring", "scopes.root.rows.map(r => { ({ a: scopes.root.hits } = { a: 2 }); return r })"],
    ["computed key", "scopes.root.rows.map(r => { scopes.root['hi' + 'ts'] = 2; return r })"],
    ["evt", "scopes.root.rows.map(r => { evt.value = 1; return r })"],
  ])("rejects a write to injected state: %s", (_name, expr) => {
    expect(() => new SaferEval().eval(expr, ctx)).toThrow(SaferEvalError);
  });

  it("still allows writes rooted at a local", () => {
    const evalr = new SaferEval();
    expect(
      evalr.eval("scopes.root.rows.reduce((acc, r) => { acc.n = (acc.n || 0) + r.qty; return acc }, {}).n", ctx),
    ).toBe(1);
    expect(evalr.eval("scopes.root.rows.map(r => { let n = 0; n++; return n })", ctx)).toEqual([1]);
  });
});

describe("SaferEval — immediately-invoked functions", () => {
  it.each([
    ["arrow", "(() => 1)()"],
    ["arrow with a body", "(s => { switch (s) { default: return 1 } })(2)"],
    ["function expression", "(function () { return 1 })()"],
    ["new on a function expression", "new (function () { this.x = 1 })()"],
    ["new on a class expression", "new (class { constructor() { this.x = 1 } })()"],
  ])("rejects an IIFE: %s", (_name, expr) => {
    expect(() => new SaferEval().eval(expr)).toThrow(SaferEvalError);
  });

  it("leaves a callback passed to a method alone", () => {
    const evalr = new SaferEval();
    expect(evalr.eval("xs.map(x => x * 2)", { xs: [1, 2] })).toEqual([2, 4]);
    expect(evalr.eval("xs.filter(x => x > 1).length", { xs: [1, 2] })).toBe(1);
  });
});

describe("SaferEval — async expressions", () => {
  it("compiles an await expression to an async fn and resolves its value", async () => {
    await expect(
      evalr.eval("(await p) + 1", { p: Promise.resolve(41) }),
    ).resolves.toBe(42);
  });

  it("classifies a rejecting await as expression-runtime", async () => {
    // Through the evaluate() wrapper, which owns error classification.
    const result = evaluate(
      { expr: "await p" },
      { p: Promise.reject(new Error("boom")) },
    ) as Promise<unknown>;
    await expect(result).rejects.toSatisfy(
      (err) => EntryError.is(err) && err.reason === "expression-runtime",
    );
  });
});

describe("SaferEval — cache eviction", () => {
  it("evicts the oldest entry when full and still evaluates it correctly", () => {
    const ev = new SaferEval({ maxCacheSize: 2 });
    expect(ev.eval("1 + 1")).toBe(2);
    expect(ev.eval("2 + 2")).toBe(4);
    expect(ev.eval("3 + 3")).toBe(6); // evicts "1 + 1"
    expect(ev.eval("1 + 1")).toBe(2); // re-analyzed from scratch
  });
});

describe("SaferEval — shadowing options", () => {
  it("extraGlobalsToShadow hides a real ambient global", () => {
    (globalThis as Record<string, unknown>).myHostGlobal = "leak";
    try {
      const ev = new SaferEval({ extraGlobalsToShadow: ["myHostGlobal"] });
      expect(ev.eval("typeof myHostGlobal")).toBe("undefined");
    } finally {
      Reflect.deleteProperty(globalThis, "myHostGlobal");
    }
  });

  it("per-call allowGlobals cannot unshadow a GLOBALS_TO_SHADOW member", () => {
    // The third eval arg widens the allowlist gate only; the shadow params are
    // fixed at construction, so `fetch` stays bound to undefined.
    const ev = new SaferEval({ enforceAllowlist: true });
    expect(ev.eval("typeof fetch", {}, ["fetch"])).toBe("undefined");
  });
});

describe("SaferEval — compilation memoization", () => {
  it("re-evaluates correctly across calls and context shapes", () => {
    const ev = new SaferEval();
    // Same context shape, different values → reuses the compiled function.
    expect(ev.eval("a + b", { a: 1, b: 2 })).toBe(3);
    expect(ev.eval("a + b", { a: 10, b: 20 })).toBe(30);
    // Different key order → distinct signature, still correct.
    expect(ev.eval("a + b", { b: 5, a: 100 })).toBe(105);
    // Different key set entirely → distinct signature, still correct.
    expect(ev.eval("a + b", { a: 7, b: 8, c: 9 })).toBe(15);
  });

  it("clearCache forces recompilation without changing results", () => {
    const ev = new SaferEval();
    expect(ev.eval("n * 2", { n: 21 })).toBe(42);
    ev.clearCache();
    expect(ev.eval("n * 2", { n: 21 })).toBe(42);
  });
});
