import { readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { groupDefs } from "./groups";

// Every global the TypeScript lib files declare: ES built-ins (`Map`) and DOM globals (`Image`, `Text`).
const readGlobalNames = (): Set<string> => {
  const libDir = join(dirname(createRequire(import.meta.url).resolve("typescript/package.json")), "lib");
  const names = new Set<string>();
  for (const file of readdirSync(libDir).filter((name) => /^lib\..*\.d\.ts$/.test(name))) {
    const source = readFileSync(join(libDir, file), "utf8");
    for (const [, name] of source.matchAll(/^declare (?:var|function|class|namespace) (\w+)/gm)) {
      names.add(name);
    }
  }
  return names;
};

describe("component names", () => {
  it("no component is named like a JavaScript or browser global", () => {
    const globals = readGlobalNames();
    // A lib layout the pattern no longer matches must fail, not pass on an empty set.
    expect(globals.has("Map")).toBe(true);
    expect(groupDefs.map((def) => def.name).filter((name) => globals.has(name))).toEqual([]);
  });
});
