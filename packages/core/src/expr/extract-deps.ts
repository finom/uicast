import type { ExpressionEvaluator } from "@uicast/expr";
import { type ComponentEntry, isComponentListEntry } from "../types";
import { depKey } from "../scope/parse-scope";

// "render": props, hidden, busy (a list item's part); "each": the container's; "all": both.
export type DepsPart = "all" | "render" | "each";

// Entries are immutable, so cached reads never go stale.
const cache = new WeakMap<ComponentEntry, Partial<Record<DepsPart, string[]>>>();

// seed runs once and callbacks read at fire time, so neither is scanned.
export function extractDeps(entry: ComponentEntry, evaluator: ExpressionEvaluator, part: DepsPart): string[] {
  const slots = cache.get(entry);
  const cached = slots?.[part];
  if (cached) return cached;

  const out = new Set<string>();
  const add = (expr: string) => {
    for (const r of evaluator.memberReads(expr, "scopes")) out.add(depKey(r));
  };

  if (part !== "each") {
    if (entry.props && "expr" in entry.props && entry.props.expr) add(entry.props.expr);
    if (entry.hidden) add(entry.hidden);
    if (entry.busy) add(entry.busy);
  }

  // `each` reads both the list and anything its filter touches (e.g. a search term).
  if (part !== "render" && isComponentListEntry(entry)) add(entry.each);

  const result = [...out];
  cache.set(entry, { ...slots, [part]: result });
  return result;
}
