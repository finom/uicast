import { type ComponentEntry, isComponentListEntry } from "../types";
import { getScopeReads } from "./evaluate";

/**
 * Which of the entry's expressions to scan:
 * - `"all"` — props + hidden + each (a plain element's full reactive surface).
 * - `"render"` — props + hidden only. A list ITEM subscribes with this: the
 *   list's container already re-renders every row when `each` changes, so an
 *   item subscribing to `each` too would double-render each row.
 * - `"each"` — each only. The list CONTAINER subscribes with this: a write
 *   that only moves a prop doesn't rebuild the rows.
 */
export type DepsPart = "all" | "render" | "each";

// Entries are immutable, so cached reads never go stale; WeakMap so a dropped
// entry can be collected.
const cache = new WeakMap<ComponentEntry, Partial<Record<DepsPart, string[]>>>();

// The reactive scopes.X.Y paths an entry reads — the renderer subscribes to
// these. (seed runs once and callbacks read at fire time, so neither is
// scanned.)
export function extractDeps(
  entry: ComponentEntry,
  part: DepsPart = "all",
): string[] {
  const slots = cache.get(entry);
  const cached = slots?.[part];
  if (cached) return cached;

  const out = new Set<string>();

  if (part !== "each") {
    if (entry.props && "expr" in entry.props && entry.props.expr) {
      for (const r of getScopeReads(entry.props.expr)) out.add(r);
    }
    if (entry.hidden) {
      for (const r of getScopeReads(entry.hidden)) out.add(r);
    }
  }

  // `each` reads both the list and anything its filter touches (e.g. a search term).
  if (part !== "render" && isComponentListEntry(entry)) {
    for (const r of getScopeReads(entry.each)) out.add(r);
  }

  const result = [...out];
  cache.set(entry, { ...slots, [part]: result });
  return result;
}
