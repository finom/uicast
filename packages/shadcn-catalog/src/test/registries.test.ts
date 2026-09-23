import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { defs } from "../all-defs";
import { impls } from "../all-impls";
import { defs as essentialDefs } from "../essential-defs";
import { impls as essentialImpls } from "../essential-impls";

// The registries are hand-maintained; a pair missing from one fails only in a consumer.

const catalogDir = resolve(import.meta.dirname, "../uicast-catalog");

describe("catalog registries", () => {
  it("every def name is unique", () => {
    const names = defs.map((def) => def.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("defs and impls pair 1:1 by name", () => {
    const defNames = new Set(defs.map((def) => def.name));
    const implNames = new Set(impls.map((impl) => impl.def.name));
    expect([...implNames].filter((n) => !defNames.has(n))).toEqual([]);
    expect([...defNames].filter((n) => !implNames.has(n))).toEqual([]);
    expect(impls.length).toBe(defs.length);
  });

  it("the essential registries are a subset of the full ones, paired 1:1", () => {
    const essentialDefNames = essentialDefs.map((def) => def.name);
    const essentialImplNames = essentialImpls.map((impl) => impl.def.name);
    expect(essentialDefNames).toEqual(essentialImplNames);
    expect(new Set(essentialDefNames).size).toBe(essentialDefNames.length);
    const all = new Set(defs.map((def) => def.name));
    expect(essentialDefNames.filter((name) => !all.has(name))).toEqual([]);
  });

  it("every src/uicast-catalog/ component directory is registered", () => {
    const dirs = readdirSync(catalogDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
    expect(defs.length).toBe(dirs.length);
  });
});
