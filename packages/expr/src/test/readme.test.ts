import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { Evaluator, ExpressionError, type StandardToolV0 } from "../index";
import { ALLOWED_GLOBALS } from "../constants/globals";
import { DEFAULT_BUDGET } from "../constants/limits";
import { METHOD_NAMES, NAMESPACE_METHOD_NAMES } from "../constants/methods";

// Every runnable example in README.md, run.

describe("README", () => {
  it("the opening example", () => {
    const rows = [{ stock: 1 }, { stock: 0 }, { stock: 4 }];
    const ev = new Evaluator();
    expect(ev.eval("rows.filter(r => r.stock > 0).length", { rows })).toBe(2);
    expect(() => ev.eval('rows["pu" + "sh"]({ stock: 9 })', { rows })).toThrow(
      /"push" is not an available method on array/,
    );
  });

  it("the callback examples", () => {
    const ev = new Evaluator();
    expect(ev.eval("Array.from({ length: 3 }, (_, i) => i)")).toEqual([0, 1, 2]);
    expect(ev.eval("rows.filter(Boolean)", { rows: [0, 1, ""] })).toEqual([1]);
    expect(ev.eval("ids.map(Number)", { ids: ["1", "2"] })).toEqual([1, 2]);
    expect(() => ev.eval("[x => x]")).toThrow(/only be written as a method's callback/);
  });

  it("random values come from a host function; the time is in the language", () => {
    const ev = new Evaluator({
      functions: [{ name: "random", description: "A random number in [0, 1)", execute: () => Math.random() }],
    });
    expect(ev.eval<number>("random()")).toBeLessThan(1);
    expect(() => ev.eval("Math.random()")).toThrow(/"Math.random\(\)" is not available/);
    expect(typeof ev.eval("Date.now()")).toBe("number");
  });

  it("the constructor options", () => {
    const ev = new Evaluator({
      functions: [],
      maxSourceLength: 1000,
      budget: { steps: 200_000 },
    });
    expect(ev.eval("1 + 1")).toBe(2);
  });

  it("contexts are searched right to left", () => {
    const ev = new Evaluator();
    expect(ev.eval("a", { a: 1 }, { a: 2 })).toBe(2);
  });

  it("the type parameters", () => {
    const ev = new Evaluator();
    const n: number = ev.eval<number>("1 + 1");
    expect(n).toBe(2);
    const price = ev.compile<string, [{ cents: number }]>("'$' + (cents / 100).toFixed(2)");
    const out: string = price({ cents: 1999 });
    expect(out).toBe("$19.99");
  });

  it("the host-function example", async () => {
    const users = [{ id: 7, name: "Ada" }];
    const numberId = {
      "~standard": {
        version: 1,
        vendor: "test",
        validate: (v: unknown) =>
          typeof (v as { id?: unknown })?.id === "number"
            ? { value: v }
            : { issues: [{ message: "id must be a number" }] },
        jsonSchema: () => ({ type: "object" }),
      },
    } as unknown as NonNullable<StandardToolV0["inputSchema"]>;

    const ev = new Evaluator({
      functions: [
        {
          name: "getUser",
          description: "Look up a user by id",
          inputSchema: numberId,
          execute: async (input) => users.find((u) => u.id === (input as { id: number }).id),
        } as StandardToolV0,
      ],
    });

    const user = await ev.eval("getUser({ id: 7 })");
    expect(user).toEqual({ id: 7, name: "Ada" });
    expect(ev.eval("user.name", { user })).toBe("Ada");
    expect(() => ev.eval("getUser({ id: 'seven' })")).toThrow(/rejected its argument/);
    expect(() => ev.eval("getUser({ id: 7 }).name")).toThrow(/must be the result itself/);
    expect(() => ev.eval("ids.map(id => getUser({ id }))", { ids: [7] })).toThrow(/cannot be called inside a callback/);
  });

  it("a tool is refused anywhere but the callee, with 0 or 1 argument", () => {
    const ev = new Evaluator({
      functions: [{ name: "getUser", description: "", execute: () => 1 }],
    });
    expect(() => ev.eval("getUser(a, b)", { a: 1, b: 2 })).toThrow(ExpressionError);
    expect(() => ev.eval("[getUser]")).toThrow(ExpressionError);
  });

  it("a function in a context is not callable — contexts are data", () => {
    const ev = new Evaluator();
    expect(() => ev.eval("f()", { f: () => 1 })).toThrow(/holds a function/);
  });

  it("the exit gate example", () => {
    const ev = new Evaluator();
    class User {
      name = "Ada";
    }
    expect(() => ev.eval("user", { user: new User() })).toThrow(/The result contains a User, which is not plain data/);
    expect(() => ev.eval("scopes.fn", { scopes: { fn: () => 1 } })).toThrow(
      /"fn" holds a function, which cannot be read/,
    );
  });

  it("the divergences it lists", () => {
    const ev = new Evaluator();
    expect(() => ev.eval("typeof nope")).toThrow(ExpressionError);
    expect(() => ev.eval("Object.keys(1)")).toThrow(ExpressionError);
    expect(() => ev.eval("nope")).toThrow(expect.objectContaining({ reason: "unknown-reference" }));
  });
});

describe("the README's language section matches the tables", () => {
  const readme = readFileSync(resolve(__dirname, "../../README.md"), "utf8");
  const section = readme.slice(readme.indexOf("## The language"), readme.indexOf("## Evaluator"));
  const tokens = (text: string, pattern: RegExp): Set<string> => new Set([...text.matchAll(pattern)].map((m) => m[1]));
  const RECEIVERS: Record<string, string> = {
    Array: "array",
    String: "string",
    Number: "number",
  };

  it("lists every method of every receiver, and nothing else", () => {
    const seen = new Set<string>();
    const methods = section.slice(section.indexOf("**Methods.**"), section.indexOf("**Static.**"));
    for (const line of methods.split("\n- ").slice(1)) {
      const label = line.slice(0, line.indexOf(":"));
      const key = RECEIVERS[label];
      expect(key, `unknown receiver "${label}"`).toBeDefined();
      seen.add(key);
      expect([...tokens(line, /`\.(\w+)\(\)`/g)].sort(), label).toEqual([...METHOD_NAMES[key]].sort());
    }
    expect([...seen].sort()).toEqual(Object.keys(METHOD_NAMES).sort());
  });

  it("lists every static method, and nothing else", () => {
    const listed = new Map<string, Set<string>>();
    const listedPart = section.slice(0, section.indexOf("**Not in the language.**"));
    for (const [, ns, name] of listedPart.matchAll(/`([A-Z]\w*)\.(\w+)\(\)`/g)) {
      listed.set(ns, (listed.get(ns) ?? new Set()).add(name));
    }
    expect([...listed.keys()].sort()).toEqual(Object.keys(NAMESPACE_METHOD_NAMES).sort());
    for (const [ns, names] of listed) {
      expect([...names].sort(), ns).toEqual([...NAMESPACE_METHOD_NAMES[ns]].sort());
    }
  });

  it("gives the budget defaults", () => {
    const budget = readme.slice(readme.indexOf("## Budget"), readme.indexOf("## Host functions"));
    const listed = Object.fromEntries(
      [...budget.matchAll(/^\| `(\w+)` \| (\d+) \|/gm)].map(([, name, value]) => [name, Number(value)]),
    );
    expect(listed).toEqual(DEFAULT_BUDGET);
  });

  it("lists every global, and nothing else", () => {
    const line = section.slice(section.indexOf("**Globals.**"), section.indexOf("**Methods.**"));
    expect([...tokens(line, /`(\w+)`/g)].sort()).toEqual([...ALLOWED_GLOBALS].sort());
  });
});
