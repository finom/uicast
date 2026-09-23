import { describe, expect, it } from "vitest";
import {
  type EvaluatorContexts,
  Evaluator,
  type ExpressionEvaluator,
  type ExpressionFacts,
  type StandardToolV0,
} from "@uicast/expr";
import { PassthroughEvaluator } from "@uicast/expr-passthrough";
import { EntryError } from "../../entry-error";
import { evaluate } from "../evaluate";

const tool = (name: string): StandardToolV0 => ({ name, description: "", execute: () => 42 });

// A toy language: the source is a key into `scopes`, or a host-function name.
class ToyEvaluator implements ExpressionEvaluator {
  constructor(readonly functions: readonly StandardToolV0[] = [tool("now")]) {}
  validate(source: string): ExpressionFacts {
    return { freeIds: [source], toolCalls: source === "now" ? ["now"] : [] };
  }
  memberReads(source: string, root: string): readonly string[] {
    return source === "now" ? [] : [`${root}.${source}`];
  }
  compile<TOut = unknown, TIn extends EvaluatorContexts = EvaluatorContexts>(source: string): (...contexts: TIn) => TOut {
    return (...contexts) => this.eval<TOut>(source, ...contexts);
  }
  eval<TOut = unknown, TIn extends EvaluatorContexts = EvaluatorContexts>(source: string, ...contexts: TIn): TOut {
    const scopes = contexts[0]?.scopes as Record<string, unknown>;
    return (source === "now" ? 42 : scopes[source]) as TOut;
  }
}

describe("ExpressionEvaluator", () => {
  it("is implemented by both shipped evaluators", () => {
    const shipped: ExpressionEvaluator[] = [new Evaluator(), new PassthroughEvaluator()];
    for (const ev of shipped) {
      expect(evaluate({ expr: "scopes.root.n + 1" }, { scopes: { root: { n: 1 } } }, ev)).toBe(2);
      expect(ev.memberReads("scopes.root.n + 1", "scopes")).toEqual(["scopes.root.n"]);
      expect(ev.validate("scopes.root.n").toolCalls).toEqual([]);
    }
  });

  it("can be implemented for another language", () => {
    const own = new ToyEvaluator();
    expect(evaluate({ expr: "n" }, { scopes: { n: 7 } }, own)).toBe(7);
    expect(evaluate({ expr: "now" }, { scopes: {} }, own)).toBe(42);
    expect(own.compile<number>("n")({ scopes: { n: 3 } })).toBe(3);
  });

  it("still gets uicast's name screen and error classification", () => {
    const clash = new ToyEvaluator([tool("scopes")]);
    expect(() => evaluate({ expr: "n" }, { scopes: {} }, clash)).toThrow(expect.objectContaining({ reason: "host-function" }));

    class Throwing extends ToyEvaluator {
      override eval(): never {
        throw new Error("nope");
      }
    }
    expect(() => evaluate({ expr: "n" }, { scopes: {} }, new Throwing())).toThrow(
      expect.objectContaining({ reason: "expression-runtime" }),
    );

    class Classified extends ToyEvaluator {
      override eval(): never {
        throw new EntryError("bad", { reason: "expression-syntax" });
      }
    }
    expect(() => evaluate({ expr: "n" }, { scopes: {} }, new Classified())).toThrow(
      expect.objectContaining({ reason: "expression-syntax" }),
    );
  });
});
