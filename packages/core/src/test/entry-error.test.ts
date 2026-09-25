import { describe, expect, it } from "vitest";
import { EntryError } from "../entry-error";
import { Evaluator } from "@uicast/expr";
import { evaluate as evaluateWith } from "../expr/evaluate";
import type { ValueSource } from "../types";

const defaultEvaluator = new Evaluator();
const evaluate = (expr: ValueSource, context: Record<string, unknown>, evaluator: Evaluator = defaultEvaluator) =>
  evaluateWith(expr, context, evaluator);

describe("EntryError", () => {
  it("derives fault from reason — one source of truth", () => {
    expect(new EntryError("x", { reason: "expression-syntax" }).fault).toBe("document");
    expect(new EntryError("x", { reason: "invalid-arguments" }).fault).toBe("document");
    expect(new EntryError("x", { reason: "host-function" }).fault).toBe("environment");
    expect(new EntryError("x", { reason: "implementation" }).fault).toBe("environment");
    expect(new EntryError("x", { reason: "expression-runtime" }).fault).toBe("unknown");
  });

  it("is() brand check survives where instanceof would (and rejects lookalikes)", () => {
    const err = new EntryError("x", { reason: "unknown" });
    expect(EntryError.is(err)).toBe(true);
    expect(EntryError.is(new Error("x"))).toBe(false);
    expect(EntryError.is(null)).toBe(false);
    expect(EntryError.is({ uicastEntryError: true })).toBe(true);
  });

  it("wrap() classifies a raw error, keeps the original in cause", () => {
    const original = new TypeError("boom");
    const wrapped = EntryError.wrap(original, "host-function", "el-1");
    expect(wrapped.reason).toBe("host-function");
    expect(wrapped.elementKey).toBe("el-1");
    expect(wrapped.message).toBe("boom");
    expect(wrapped.cause).toBe(original);
  });

  it("wrap() passes an existing EntryError through — deepest classification wins", () => {
    const tagged = new EntryError("no such order", {
      reason: "invalid-arguments",
    });
    const rewrapped = EntryError.wrap(tagged, "host-function", "el-2");
    expect(rewrapped).toBe(tagged);
    expect(rewrapped.reason).toBe("invalid-arguments");
    expect(rewrapped.elementKey).toBe("el-2");
    expect(EntryError.wrap(tagged, "unknown", "other").elementKey).toBe("el-2");
  });
});

describe("evaluate — classification at the throw site", () => {
  it("tags a syntax error as expression-syntax (document)", () => {
    try {
      evaluate({ expr: "scopes.root.count +" }, { scopes: {} });
      expect.unreachable();
    } catch (err) {
      expect(EntryError.is(err) && err.reason).toBe("expression-syntax");
      expect(EntryError.is(err) && err.fault).toBe("document");
    }
  });

  it("tags a blocked property access as guardrail-violation (document)", () => {
    try {
      evaluate({ expr: "[].constructor" }, { scopes: {} });
      expect.unreachable();
    } catch (err) {
      expect(EntryError.is(err) && err.reason).toBe("guardrail-violation");
    }
  });

  it("tags an unregistered identifier as unknown-reference (document)", () => {
    try {
      evaluate({ expr: "fetchRows()" }, { scopes: {} });
      expect.unreachable();
    } catch (err) {
      expect(EntryError.is(err) && err.reason).toBe("unknown-reference");
    }
  });

  it("tags an exhausted budget as budget-exceeded (document)", () => {
    try {
      evaluate({ expr: '"x".repeat(1e9)' }, { scopes: {} });
      expect.unreachable();
    } catch (err) {
      expect(EntryError.is(err) && err.reason).toBe("budget-exceeded");
      expect(EntryError.is(err) && err.fault).toBe("document");
    }
  });

  it("tags a runtime throw in a valid expression as expression-runtime (unknown)", () => {
    try {
      evaluate({ expr: "scopes.root.user.name" }, { scopes: { root: { user: null } } });
      expect.unreachable();
    } catch (err) {
      expect(EntryError.is(err) && err.reason).toBe("expression-runtime");
      expect(EntryError.is(err) && err.fault).toBe("unknown");
    }
  });

  it("tags a sync host-function throw as host-function (environment)", () => {
    try {
      evaluate(
        { expr: "boom()" },
        { scopes: {} },
        new Evaluator({
          functions: [
            {
              name: "boom",
              description: "",
              execute: () => {
                throw new Error("server down");
              },
            },
          ],
        }),
      );
      expect.unreachable();
    } catch (err) {
      expect(EntryError.is(err) && err.reason).toBe("host-function");
      expect(EntryError.is(err) && err.fault).toBe("environment");
    }
  });

  it("tags an async host-function rejection as host-function", async () => {
    const result = evaluate(
      { expr: "boom()" },
      { scopes: {} },
      new Evaluator({
        functions: [
          {
            name: "boom",
            description: "",
            execute: async () => {
              throw new Error("500");
            },
          },
        ],
      }),
    );
    await expect(result).rejects.toSatisfy((err: unknown) => EntryError.is(err) && err.reason === "host-function");
  });

  it("passes a host-thrown EntryError through untouched", () => {
    try {
      evaluate(
        { expr: "lookup()" },
        { scopes: {} },
        new Evaluator({
          functions: [
            {
              name: "lookup",
              description: "",
              execute: () => {
                throw new EntryError("no such order", {
                  reason: "invalid-arguments",
                });
              },
            },
          ],
        }),
      );
      expect.unreachable();
    } catch (err) {
      expect(EntryError.is(err) && err.reason).toBe("invalid-arguments");
      expect(EntryError.is(err) && err.fault).toBe("document");
    }
  });
});
