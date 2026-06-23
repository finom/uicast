import { ComponentEntry, isComponentListEntry } from "../types";
import { getScopeReads } from "./evaluate";

// Entries are immutable, so cached reads never go stale; WeakMap so a dropped
// entry can be collected.
const cache = new WeakMap<ComponentEntry, string[]>();

// The reactive scopes.X.Y paths an entry reads, across its props, hidden, and each
// expressions — the renderer subscribes to these. (seed run once and
// callbacks read at fire time, so neither is scanned.)
export function extractDeps(entry: ComponentEntry): string[] {
  const cached = cache.get(entry);
  if (cached) return cached;

  const out = new Set<string>();

  if (entry.props && "expr" in entry.props && entry.props.expr) {
    for (const r of getScopeReads(entry.props.expr)) out.add(r);
  }
  if (entry.hidden) {
    for (const r of getScopeReads(entry.hidden)) out.add(r);
  }

  // `each` reads both the list and anything its filter touches (e.g. a search term).
  if (isComponentListEntry(entry)) {
    for (const r of getScopeReads(entry.each)) out.add(r);
  }

  const result = [...out];
  cache.set(entry, result);
  return result;
}
