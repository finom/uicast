import type { ExpressionEvaluator } from "@uicast/expr";
import { type ComponentEntry, isComponentListEntry } from "../types";
import { depKey } from "../scope/parse-scope";
import { getScopeReads } from "./evaluate";

// "all": props + hidden + each. "render": props + hidden, for list items (the container re-renders rows on `each`).
// "each": the container only.
export type DepsPart = "all" | "render" | "each";

// Entries are immutable and the reads are static, so cached reads never go
// stale; WeakMap so a dropped entry can be collected.
const cache = new WeakMap<ComponentEntry, Partial<Record<DepsPart, string[]>>>();

// The `scopes.<scope>.<field>` keys an entry reads — the renderer subscribes to
// these. (seed runs once and callbacks read at fire time, so neither is
// scanned.)
export function extractDeps(
  entry: ComponentEntry,
  evaluator: ExpressionEvaluator,
  part: DepsPart = "all",
): string[] {
  const slots = cache.get(entry);
  const cached = slots?.[part];
  if (cached) return cached;

  const out = new Set<string>();
  const add = (expr: string) => {
    for (const r of getScopeReads(expr, evaluator)) {
      const key = depKey(r);
      if (key) out.add(key);
    }
  };

  if (part !== "each") {
    if (entry.props && "expr" in entry.props && entry.props.expr) add(entry.props.expr);
    if (entry.hidden) add(entry.hidden);
  }

  // `each` reads both the list and anything its filter touches (e.g. a search term).
  if (part !== "render" && isComponentListEntry(entry)) add(entry.each);

  const result = [...out];
  cache.set(entry, { ...slots, [part]: result });
  return result;
}
