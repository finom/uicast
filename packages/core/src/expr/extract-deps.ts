import { ComponentEntry, isComponentListEntry } from "../types";
import { getScopeReads } from "./evaluate";

// Chunks are immutable, so cached reads never go stale; WeakMap so a dropped
// chunk's entry can be collected.
const cache = new WeakMap<ComponentEntry, string[]>();

// The reactive scopes.X.Y paths a chunk reads, across its props, hidden, and each
// expressions — the renderer subscribes to these. (defaults run once and
// callbacks read at fire time, so neither is scanned.)
export function extractDeps(chunk: ComponentEntry): string[] {
  const cached = cache.get(chunk);
  if (cached) return cached;

  const out = new Set<string>();

  if (chunk.props && "expr" in chunk.props && chunk.props.expr) {
    for (const r of getScopeReads(chunk.props.expr)) out.add(r);
  }
  if (chunk.hidden) {
    for (const r of getScopeReads(chunk.hidden)) out.add(r);
  }

  // `each` reads both the list and anything its filter touches (e.g. a search term).
  if (isComponentListEntry(chunk)) {
    for (const r of getScopeReads(chunk.each)) out.add(r);
  }

  const result = [...out];
  cache.set(chunk, result);
  return result;
}
