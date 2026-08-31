import { readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { allDefinitions } from "../defs";
import { allImplementations } from "../impls";

// defs.ts and impls.ts are hand-maintained mirrors of src/uicast/. Nothing
// else guards them against drift: a pair left out of one registry, or a def
// without an impl, would fail only at runtime in a consumer.

const uicastDir = resolve(dirname(fileURLToPath(import.meta.url)), "../uicast");

describe("catalog registries", () => {
  it("every def name is unique", () => {
    const names = allDefinitions.map((def) => def.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("defs and impls pair 1:1 by name", () => {
    const defNames = new Set(allDefinitions.map((def) => def.name));
    const implNames = new Set(allImplementations.map((impl) => impl.def.name));
    expect([...implNames].filter((n) => !defNames.has(n))).toEqual([]);
    expect([...defNames].filter((n) => !implNames.has(n))).toEqual([]);
    expect(implNames.size).toBe(defNames.size);
  });

  it("every src/uicast/ component directory is registered", () => {
    const dirs = readdirSync(uicastDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
    expect(allDefinitions.length).toBe(dirs.length);
  });
});
