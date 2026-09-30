import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { Evaluator } from "@uicast/expr";

const ev = new Evaluator();

function collect(entry: Record<string, unknown>, out: string[]): void {
  const vs = (v: unknown) => {
    if (v && typeof v === "object" && "expr" in v && typeof v.expr === "string") out.push(v.expr);
  };
  vs(entry.props);
  if (typeof entry.hidden === "string") out.push(entry.hidden);
  if (typeof entry.loading === "string") out.push(entry.loading);
  if (typeof entry.each === "string") out.push(entry.each);
  for (const step of (entry.seed as unknown[]) ?? []) vs(step);
  for (const steps of Object.values((entry.callbacks as Record<string, unknown[]>) ?? {})) {
    for (const step of steps) vs(step);
  }
}

describe("every shipped document validates against the current language", () => {
  // Cross-package on purpose: nothing else fails when a language change breaks these documents.
  const read = (path: string): Record<string, unknown>[] =>
    JSON.parse(readFileSync(new URL(`../../../../../docs/src/${path}`, import.meta.url), "utf8"));
  const sources: [string, Record<string, unknown>[]][] = [];
  for (const name of ["orders", "kanban", "warehouses", "delivery", "shop", "loan", "wifi"]) {
    sources.push([`replay:${name}`, read(`components/replay/${name}.json`)]);
  }
  for (const name of ["counter", "tracker", "weather", "orders"]) {
    sources.push([`mini:${name}`, read(`lib/mini-examples/${name}/entries.json`)]);
  }

  for (const [name, entries] of sources) {
    it(name, () => {
      let total = 0;
      for (const entry of entries) {
        const exprs: string[] = [];
        collect(entry, exprs);
        for (const e of exprs) {
          total++;
          expect(() => ev.validate(e), `${String(entry.key)}: ${e}`).not.toThrow();
        }
      }
      expect(total).toBeGreaterThan(0);
    });
  }
});
