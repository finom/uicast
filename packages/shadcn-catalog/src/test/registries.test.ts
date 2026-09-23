import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import * as allDefs from "../all/defs";
import * as allImpls from "../all/impls";
import * as essentialDefs from "../essential/defs";
import * as essentialImpls from "../essential/impls";
import { groupDefs, groups } from "./groups";

// The registries are hand-maintained; a pair missing from one fails only in a consumer.

const catalogDir = resolve(import.meta.dirname, "../uicast-catalog");
const defNames = (defs: readonly { name: string }[]) => defs.map((def) => def.name).sort();
const implNames = (impls: readonly { def: { name: string } }[]) => impls.map((impl) => impl.def.name).sort();

describe("catalog registries", () => {
  it("every def name is unique", () => {
    const names = groupDefs.map((def) => def.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it.each(Object.entries(groups))("%s: defs and impls pair 1:1 by name", (_, group) => {
    expect(implNames(group.impls)).toEqual(defNames(group.defs));
  });

  it("all holds every group, paired 1:1", () => {
    expect(defNames(Object.values(allDefs))).toEqual(defNames(groupDefs));
    expect(implNames(Object.values(allImpls))).toEqual(defNames(groupDefs));
  });

  it("the essential registries come from the groups, paired 1:1", () => {
    const names = defNames(Object.values(essentialDefs));
    expect(implNames(Object.values(essentialImpls))).toEqual(names);
    expect(new Set(names).size).toBe(names.length);
    const all = new Set(groupDefs.map((def) => def.name));
    expect(names.filter((name) => !all.has(name))).toEqual([]);
  });

  it("every src/uicast-catalog/ component directory is in a group", () => {
    const dirs = readdirSync(catalogDir, { withFileTypes: true }).filter((entry) => entry.isDirectory());
    expect(groupDefs.length).toBe(dirs.length);
  });
});
