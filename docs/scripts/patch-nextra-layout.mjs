// nextra-theme-docs 4.6.1 fails on zod ≥ 4.4: its Layout validates the props without `children`.
// Applies the upstream fix (shuding/nextra#4990, merged, unreleased); drop this script once a release has it.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const file = join(dirname(fileURLToPath(import.meta.resolve("nextra-theme-docs"))), "layout.js");
const before = "LayoutPropsSchema.safeParse(themeConfig);\n    data = t12;";
const after = "LayoutPropsSchema.safeParse({ ...themeConfig, children });\n    data = t12;\n    delete data?.children;";

const source = readFileSync(file, "utf8");
if (!source.includes(after)) {
  if (!source.includes(before)) throw new Error(`${file} changed: check whether nextra#4990 is released`);
  writeFileSync(file, source.replace(before, after));
}
