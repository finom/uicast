import { describe, expect, it } from "vitest";
import { Evaluator, ExpressionError, type StandardToolV0 } from "@uicast/expr";
import type { ValueSource } from "../../types";
import { EntryError } from "../../entry-error";
import { evaluate as evaluateWith } from "../evaluate";

const defaultEvaluator = new Evaluator();
const evaluate = (expr: ValueSource, context: Record<string, unknown>, evaluator: Evaluator = defaultEvaluator) =>
  evaluateWith(expr, context, evaluator);

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
    expect(evaluate({} as ValueSource, {})).toBeNull();
  });

  it("rejects an empty-string expr as a classified document fault", () => {
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
  it("exposes the evaluator's functions as bare identifiers", () => {
    const result = evaluate(
      { expr: "double(3)" },
      {},
      new Evaluator({
        functions: [
          {
            name: "double",
            description: "",
            execute(n: number) {
              return n * 2;
            },
          },
        ],
      }),
    );
    expect(result).toBe(6);
  });

  it("exposes evt to callbacks", () => {
    const result = evaluate({ expr: "evt.value + 1" }, { evt: { value: 10 } });
    expect(result).toBe(11);
  });

  it("lets a host function take any name the language does not use", () => {
    const result = evaluate(
      { expr: "fetch(21)" },
      {},
      new Evaluator({
        functions: [{ name: "fetch", description: "", execute: (n: number) => n * 2 }],
      }),
    );
    expect(result).toBe(42);
  });

  it.each([["get-user"], ["delete"], ["class"], ["await"]])(
    "a host function whose name is not an identifier is refused by the evaluator itself: %s",
    (name) => {
      try {
        new Evaluator({ functions: [{ name, description: "", execute: () => 1 }] });
        expect.unreachable();
      } catch (err) {
        expect(ExpressionError.is(err) && err.reason).toBe("host-function");
        expect(ExpressionError.is(err) && err.message).toContain(name);
      }
    },
  );

  it("splits a bad call from a bad host, by whose fault it is", () => {
    const numbers = {
      "~standard": {
        version: 1,
        vendor: "test",
        validate: (value: unknown) =>
          typeof value === "number" ? { value } : { issues: [{ message: "expected a number" }] },
      },
    } as unknown as NonNullable<StandardToolV0["inputSchema"]>;

    const call = (expr: string, tool: Partial<StandardToolV0>) =>
      evaluate(
        { expr },
        {},
        new Evaluator({
          functions: [{ name: "tool", description: "", execute: (i: unknown) => i, ...tool }],
        }),
      );

    expect(() => call('tool("nope")', { inputSchema: numbers })).toThrow(
      expect.objectContaining({ reason: "invalid-arguments", fault: "document" }),
    );
    expect(() => call("tool(1)", { outputSchema: numbers, execute: () => "nope" })).toThrow(
      expect.objectContaining({ reason: "host-function", fault: "environment" }),
    );
  });

  it("keeps an EntryError the host classified itself", () => {
    const own = new EntryError("no seats left", { reason: "invalid-arguments" });
    expect(() =>
      evaluate(
        { expr: "tool(1)" },
        {},
        new Evaluator({
          functions: [
            {
              name: "tool",
              description: "",
              execute: () => {
                throw own;
              },
            },
          ],
        }),
      ),
    ).toThrow(own);
  });
});

describe("evaluate — the evaluator's maxSourceLength", () => {
  it("rejects an oversized expression as a classified document fault", () => {
    expect(() => evaluate({ expr: "1 + 1 + 1" }, {}, new Evaluator({ maxSourceLength: 5 }))).toThrow(
      expect.objectContaining({ message: expect.stringContaining("too long") }),
    );
    expect(evaluate({ expr: "1 + 1" }, {}, new Evaluator({ maxSourceLength: 5 }))).toBe(2);
  });
});

describe("evaluate — uicast's host function name screen", () => {
  const tool = (name: string) => ({ name, description: "", execute: () => 1 });

  it.each([
    ["scopes", "is reserved"],
    ["evt", "is reserved"],
    ["currentValue", "is reserved"],
  ])("rejects %s (%s)", (name, message) => {
    const ev = new Evaluator({ functions: [tool(name)] });
    expect(() => evaluate({ expr: "1" }, {}, ev)).toThrow(
      expect.objectContaining({ message: expect.stringContaining(message) }),
    );
    try {
      evaluate({ expr: "1" }, {}, ev);
    } catch (err) {
      expect(EntryError.is(err) && err.reason === "host-function").toBe(true);
    }
  });
});
