import { useRef } from "react";
import {
  createProxyScope,
  type ComponentListEntry,
  type ReactiveProxy,
} from "@uicast/core";
import { extractDeps } from "@uicast/core/internal";
import {
  setItemForwardTargets,
  type ForwardTarget,
} from "../item-write-forwarding";
import { useRendererRegistry } from "../store/renderer-registry";
import type { Scopes } from "../types";

type ItemId = string | number;

export type ItemRow = {
  itemId: ItemId;
  itemProxy: ReactiveProxy;
  itemScopes: Scopes;
};

// A list item's stable id: the `keyBy` field, or its index when `keyBy` is
// absent or the item lacks the field. The stable id keeps an item's proxy +
// scope identity across re-renders.
function getItemId(keyBy: string | undefined, item: unknown, index: number): ItemId {
  if (keyBy === undefined) return index;
  return ((item as Record<string, unknown>)?.[keyBy] ?? index) as ItemId;
}

// One item's cached state, all behind one lookup.
type CachedItem = {
  proxy: ReactiveProxy;
  // The proxy's raw target, kept for silent render-phase refreshes.
  raw: { item: unknown; index: number; id: ItemId };
  // The row's scopes object; null forces a rebuild (parent scopes changed).
  scopes: Scopes | null;
  // The item value + index `scopes` was built for.
  item: unknown;
  index: number;
};

// One child scope per list item, cached by id. Item proxies persist across
// re-renders (keyed by id) so per-item state survives reordering/streaming, and
// each item's `scopes` object is rebuilt only when its value or index changed.
// Safe with `list: null` (returns `[]`).
export function useItemScopes(
  scopes: Scopes,
  list: ComponentListEntry | null,
  items: unknown[],
): ItemRow[] {
  const { evaluator } = useRendererRegistry();
  const cache = useRef<Map<ItemId, CachedItem>>(new Map());
  const prevScopes = useRef<Scopes | null>(null);

  if (!list) return [];

  // Parent scope identity changed → every cached item scope is stale. Proxies
  // are kept (item state survives); only the scope wrappers rebuild below.
  if (prevScopes.current !== scopes) {
    for (const cached of cache.current.values()) cached.scopes = null;
    prevScopes.current = scopes;
  }

  // Where a row's writes forward. `item.*` writes hit every scope path the
  // `each` expression reads (the source array, plus any extra dep of a
  // derived `each` — an over-approximation that only ever wakes an extra
  // reader); ANY row write hits the containing scope's `childScopes.<as>`.
  const forwardTargets: ForwardTarget[] = [];
  for (const dep of extractDeps(list, evaluator, "each")) {
    const [head, name, ...rest] = dep.split(".");
    if (head !== "scopes" || !name || rest.length === 0) continue;
    const scope = scopes[name];
    if (scope) forwardTargets.push({ scope, path: rest.join("."), dep });
  }
  // Same innermost-scope invariant as the childScopes publish in the
  // renderer: scopes are appended parents-first, so the last key is the scope
  // this list lives in.
  const names = Object.keys(scopes);
  const containing = names[names.length - 1];
  forwardTargets.push({
    scope: scopes[containing],
    path: `childScopes.${list.as}`,
    dep: `scopes.${containing}.childScopes.${list.as}`,
    anyWrite: true,
  });

  const ids = items.map((item, index) => getItemId(list.keyBy, item, index));

  // Drop caches for items no longer present.
  const currentIds = new Set(ids);
  for (const id of [...cache.current.keys()]) {
    if (!currentIds.has(id)) cache.current.delete(id);
  }

  return items.map((item, index) => {
    const itemId = ids[index];

    // Reuse or create this item's proxy, then refresh its data so edited /
    // shifted items stay current.
    let cached = cache.current.get(itemId);
    if (!cached) {
      const raw = { item, index, id: itemId };
      cached = { proxy: createProxyScope(raw), raw, scopes: null, item, index };
      cache.current.set(itemId, cached);
    }
    setItemForwardTargets(cached.proxy, forwardTargets);
    // Refresh through the raw target, NOT the proxy: this runs during render,
    // and a proxy write emits — which would forceRender subscribed components
    // mid-render (React forbids it). No wakeup is lost: any item/index change
    // also rebuilds `itemScopes` identity below, which re-renders the row.
    cached.raw.item = item;
    cached.raw.index = index;

    if (!cached.scopes || cached.item !== item || cached.index !== index) {
      cached.scopes = { ...scopes, [list.as]: cached.proxy };
      cached.item = item;
      cached.index = index;
    }

    return { itemId, itemProxy: cached.proxy, itemScopes: cached.scopes };
  });
}
