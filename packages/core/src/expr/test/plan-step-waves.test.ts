import { describe, expect, it } from "vitest";
import { Evaluator } from "@uicast/expr";
import { planStepWaves as plan } from "../plan-step-waves";

const ev = new Evaluator();
const planStepWaves: <T extends { set?: string; expr?: string; confirm?: string }>(
  steps: readonly T[],
  isBarrier?: (step: T) => boolean,
  declaredWrites?: (step: T) => string[],
) => T[][] = (steps, isBarrier, declaredWrites) => plan(steps, ev, isBarrier, declaredWrites);

describe("planStepWaves", () => {
  it("keeps independent steps in one wave", () => {
    const steps = [
      { set: "scopes.root.a", expr: "loadA()" },
      { set: "scopes.root.b", expr: "loadB()" },
    ];
    expect(planStepWaves(steps)).toEqual([steps]);
  });

  it("splits a step that reads an earlier step's write", () => {
    const city = { set: "scopes.root.city", literal: "Amsterdam" };
    const weather = { set: "scopes.root.weather", expr: "getWeather({ city: scopes.root.city })" };
    expect(planStepWaves([city, weather])).toEqual([[city], [weather]]);
  });

  it("a deep read waits for a write of its field; another field does not", () => {
    const parent = { set: "scopes.root.user", expr: "load()" };
    const childRead = { set: "scopes.root.x", expr: "scopes.root.user.name" };
    expect(planStepWaves([parent, childRead]).length).toBe(2);

    const sib = { set: "scopes.root.userName", expr: "scopes.root.other" };
    expect(planStepWaves([parent, sib]).length).toBe(1);
  });

  it("a whole-scope read waits for any write into that scope", () => {
    const write = { set: "scopes.root.a", literal: 1 };
    const keys = { set: "scopes.root.count", expr: "Object.keys(scopes.root).length" };
    expect(planStepWaves([write, keys])).toEqual([[write], [keys]]);
    const other = { set: "scopes.row.a", literal: 1 };
    expect(planStepWaves([other, keys])).toEqual([[other, keys]]);
  });

  it("treats currentValue as a read of the step's own set path", () => {
    const write = { set: "scopes.root.count", literal: 1 };
    const bump = { set: "scopes.root.count", expr: "currentValue + 1" };
    expect(planStepWaves([write, bump])).toEqual([[write], [bump]]);
  });

  it("finds currentValue in the parse: an escaped spelling reads it, a string does not", () => {
    const write = { set: "scopes.root.count", literal: 1 };
    const escaped = { set: "scopes.root.count", expr: "\\u0063urrentValue + 1" };
    const quoted = { set: "scopes.root.count", expr: '"currentValue"' };
    expect(planStepWaves([write, escaped])).toEqual([[write], [escaped]]);
    expect(planStepWaves([write, quoted])).toEqual([[write, quoted]]);
  });

  it("classifies a step that does not parse, before any step runs", () => {
    expect(() => planStepWaves([{ set: "scopes.root.a", expr: "1 +" }])).toThrow(
      expect.objectContaining({ reason: "expression-syntax", fault: "document" }),
    );
  });

  it("isolates confirm steps as barriers", () => {
    const a = { set: "scopes.root.a", expr: "loadA()" };
    const del = { set: "scopes.root.r", expr: "del()", confirm: "Sure?" };
    const b = { set: "scopes.root.b", expr: "loadB()" };
    expect(planStepWaves([a, del, b])).toEqual([[a], [del], [b]]);
  });

  it("reads that only touch untouched paths stay parallel", () => {
    const steps = [
      { set: "scopes.root.rows", expr: "list({ q: scopes.root.query })" },
      { set: "scopes.root.stats", expr: "stats({ q: scopes.root.query })" },
    ];
    expect(planStepWaves(steps)).toEqual([steps]);
  });

  it("isolates an isBarrier step even with no textual overlap", () => {
    const a = { set: "scopes.root.a", expr: "loadA()" };
    const mut = { expr: "deleteProduct({ id: 1 })" };
    const b = { set: "scopes.root.b", expr: "loadB()" };
    expect(planStepWaves([a, mut, b], (s) => s === mut)).toEqual([
      [a],
      [mut],
      [b],
    ]);
  });

  it("an isBarrier step at position 0 still starts its own wave", () => {
    const mut = { expr: "deleteProduct({ id: 1 })" };
    const b = { set: "scopes.root.b", expr: "loadB()" };
    expect(planStepWaves([mut, b], (s) => s === mut)).toEqual([[mut], [b]]);
  });

  it("declaredWrites split waves like set addresses do", () => {
    const bump = { set: "scopes.row.qty", literal: 5 };
    const sum = {
      set: "scopes.root.sum",
      expr: "scopes.root.items.reduce((s, i) => s + i.qty, 0)",
    };
    expect(
      planStepWaves([bump, sum], undefined, (step) =>
        step === bump ? ["scopes.root.items"] : [],
      ),
    ).toEqual([[bump], [sum]]);
  });
});
