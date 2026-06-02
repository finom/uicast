import type { ChunkComponent } from "../types";
import { getScopeReads } from "./evaluate";

/**
 * Per-chunk cache for the union of `scopes.X.Y` paths the chunk reads.
 * Chunks are immutable after arrival, so the cache never goes stale.
 * `WeakMap` lets the GC reclaim entries when chunks fall out of the
 * elements map (e.g. after a partial-subtree replacement — see
 * `buildElementsById` in `utils/utils.ts`).
 */
const cache = new WeakMap<ChunkComponent, string[]>();

/**
 * Auto-detected reactive deps for a chunk.
 *
 * Walks every *reactive* expression on the chunk — `props.expr`,
 * `hidden.expr`, and (for list chunks) `each` — and unions the
 * `scopes.X.Y` paths each one reads. The renderer subscribes to those
 * paths; any write to a matching path wakes the chunk for re-render.
 *
 * Explicitly NOT scanned:
 * - `defaults` — one-shot, gated by `hasBeenRenderedRef`. Re-render
 *   doesn't re-run them; no subscription needed.
 * - `callbacks` — event-triggered. Reads happen at fire time against
 *   the current scope state; no reactive subscription required.
 *
 * The dep paths are the exact strings the chunk's runtime subscriber
 * passes to `parseScope(...)` and then `scopes[targetScope].$emitter.on(
 * targetPath, …)`. Subscription is path-exact (no parent fanout) — see
 * `createProxyScope.ts` set trap.
 */
export function extractDeps(chunk: ChunkComponent): string[] {
  const cached = cache.get(chunk);
  if (cached) return cached;

  const out = new Set<string>();

  if (chunk.props && "expr" in chunk.props && chunk.props.expr) {
    for (const r of getScopeReads(chunk.props.expr)) out.add(r);
  }
  if (chunk.hidden && "expr" in chunk.hidden && chunk.hidden.expr) {
    for (const r of getScopeReads(chunk.hidden.expr)) out.add(r);
  }

  // List chunks carry `each` as a bare expression string (not a
  // ValueSource). Folding its reads into the dep set is what fixes the
  // search-filter case: a `scopes.inv.rows.filter(r => …scopes.root.
  // searchTerm…)` expression yields both `scopes.inv.rows` AND
  // `scopes.root.searchTerm`, so typing in the search input wakes the
  // list re-render.
  if ("each" in chunk) {
    for (const r of getScopeReads(chunk.each)) out.add(r);
  }

  const result = [...out];
  cache.set(chunk, result);
  return result;
}
