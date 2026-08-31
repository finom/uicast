import { describe, expect, it } from "vitest";
import type { ValueSource } from "../../types";
import { EntryError } from "../../entry-error";
import { evaluate, getScopeReads } from "../evaluate";

describe("evaluate — ValueSource", () => {
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
    // `{}` (neither expr nor literal) is type-invalid under the strict
    // ValueSource union; cast to exercise the defensive runtime guard.
    expect(evaluate({} as ValueSource, {})).toBeNull();
  });

  it("rejects an empty-string expr as a classified document fault", () => {
    // Unlike an absent expr, "" is a model mistake the recovery loop should see.
    try {
      evaluate({ expr: "" }, {});
      expect.unreachable();
    } catch (err) {
      expect(EntryError.is(err) && err.reason).toBe("expression-syntax");
      expect(EntryError.is(err) && err.fault).toBe("document");
    }
  });

  it("reads from a scopes-shaped context", () => {
    const context = {
      scopes: { root: { count: 7 } },
    };
    expect(evaluate({ expr: "scopes.root.count * 2" }, context)).toBe(14);
  });
});

describe("evaluate — error propagation", () => {
  it("throws on a policy-rejected expression", () => {
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
      {
        functions: [
          {
            name: "double",
            description: "",
            execute(n: number) {
              return n * 2;
            },
          },
        ],
      },
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

  it("lets a host function named after a shadowed global win the clash", () => {
    // "fetch" is in GLOBALS_TO_SHADOW; the injected tool must shadow the shadow.
    const result = evaluate(
      { expr: "fetch(21)" },
      {},
      {
        functions: [
          { name: "fetch", description: "", execute: (n: number) => n * 2 },
        ],
      },
    );
    expect(result).toBe(42);
  });

  it.each([["get-user"], ["delete"], ["let"], ["class"], ["await"]])(
    "rejects a host function whose name is not usable as a parameter: %s",
    (name) => {
      try {
        evaluate(
          { expr: "1" },
          {},
          { functions: [{ name, description: "", execute: () => 1 }] },
        );
        expect.unreachable();
      } catch (err) {
        expect(EntryError.is(err) && err.reason).toBe("host-function");
        expect(EntryError.is(err) && err.message).toContain(name);
      }
    },
  );

  it("classifies a tool input-validation failure as invalid-arguments (document)", async () => {
    // Mirrors standard-tool's StandardToolValidationError without importing it —
    // detection is structural (name + target) because two package copies can
    // coexist in one bundle.
    class FakeValidationError extends Error {
      name = "StandardToolValidationError";
      constructor(readonly target: "input" | "output") {
        super(`${target} validation failed`);
      }
    }
    const reject = (target: "input" | "output") =>
      evaluate(
        { expr: "tool(1)" },
        {},
        {
          functions: [
            {
              name: "tool",
              description: "",
              execute: async () => {
                throw new FakeValidationError(target);
              },
            },
          ],
        },
      ) as Promise<unknown>;

    await expect(reject("input")).rejects.toSatisfy(
      (err) => EntryError.is(err) && err.reason === "invalid-arguments" && err.fault === "document",
    );
    // An output failure is the host's own schema breaking — environment fault.
    await expect(reject("output")).rejects.toSatisfy(
      (err) => EntryError.is(err) && err.reason === "host-function" && err.fault === "environment",
    );
  });
});

describe("getScopeReads — thin wrapper around SaferEval.scopeReads", () => {
  it("returns paths read by an expression", () => {
    expect(getScopeReads("scopes.root.a + scopes.root.b")).toEqual(
      expect.arrayContaining(["scopes.root.a", "scopes.root.b"]),
    );
  });

  it("returns an empty list for a literal", () => {
    expect(getScopeReads("1 + 2")).toEqual([]);
  });
});
