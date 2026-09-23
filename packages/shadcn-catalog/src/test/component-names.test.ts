import { readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { groupDefs } from "./groups";

// Every global the TypeScript lib files declare: ES built-ins (`Map`) and DOM globals (`Image`, `Text`).
// TypeScript 7 ships them next to its native binary, in the package for this platform.
const readGlobalNames = (): Set<string> => {
  const fromTypescript = createRequire(createRequire(import.meta.url).resolve("typescript/package.json"));
  const platformPackage = `@typescript/typescript-${process.platform}-${process.arch}/package.json`;
  const libDir = join(dirname(fromTypescript.resolve(platformPackage)), "lib");
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
