import { describe, expect, it } from "vitest";
import { planStepWaves } from "../plan-step-waves";

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

  it("matches writes and reads on dot-boundary prefixes, both directions", () => {
    const parent = { set: "scopes.root.user", expr: "load()" };
    const childRead = { set: "scopes.root.x", expr: "scopes.root.user.name" };
    expect(planStepWaves([parent, childRead]).length).toBe(2);

    const child = { set: "scopes.root.user.name", literal: "A" };
    const parentRead = { set: "scopes.root.y", expr: "save(scopes.root.user)" };
    expect(planStepWaves([child, parentRead]).length).toBe(2);

    // sibling paths don't collide
    const sib = { set: "scopes.root.userName", expr: "scopes.root.other" };
    expect(planStepWaves([parent, sib]).length).toBe(1);
  });

  it("treats currentValue as a read of the step's own set path", () => {
    const write = { set: "scopes.root.count", literal: 1 };
    const bump = { set: "scopes.root.count", expr: "currentValue + 1" };
    expect(planStepWaves([write, bump])).toEqual([[write], [bump]]);
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
});
