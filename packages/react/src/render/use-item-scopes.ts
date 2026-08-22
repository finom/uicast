import { useRef } from "react";
import {
  createProxyScope,
  type ComponentListEntry,
  type ReactiveProxy,
} from "@uicast/core";
import type { Scopes } from "../types";

type ItemId = string | number;

export type ItemRow = {
  itemId: ItemId;
  itemProxy: ReactiveProxy;
  itemScopes: Scopes;
};

// A list item's stable id: the `keyBy` field, the item itself (`_item`), or its
// index (`_index`, default). The stable id keeps an item's proxy + scope
// identity across re-renders.
function getItemId(keyBy: string | undefined, item: unknown, index: number): ItemId {
  const key = keyBy ?? "_index";
  if (key === "_index") return index;
  if (key === "_item") return item as ItemId;
  return ((item as Record<string, unknown>)?.[key] ?? index) as ItemId;
}

// One child scope per list item, cached by id. Item proxies persist across
// re-renders (keyed by id) so per-item state survives reordering/streaming, and
// each item's `scopes` object is rebuilt only when its value or index changed.
// Safe with `list: null` (returns `[]`).
export function useItemScopes(
  scopes: Scopes,
  list: ComponentListEntry | null,
  items: unknown[],
): ItemRow[] {
  const proxies = useRef<Map<ItemId, ReactiveProxy>>(new Map());
  const cachedScopes = useRef<Map<ItemId, Scopes>>(new Map());
  const cachedMeta = useRef<Map<ItemId, { item: unknown; index: number }>>(new Map());
  const prevScopes = useRef<Scopes | null>(null);

  if (!list) return [];

  // Parent scope identity changed → every cached item scope is stale. Proxies
  // are kept (item state survives); only the scope wrappers rebuild below.
  if (prevScopes.current !== scopes) {
    cachedScopes.current.clear();
    cachedMeta.current.clear();
    prevScopes.current = scopes;
  }

  const ids = items.map((item, index) => getItemId(list.keyBy, item, index));

  // Drop caches for items no longer present.
  const currentIds = new Set(ids);
  for (const id of [...proxies.current.keys()]) {
    if (!currentIds.has(id)) {
      proxies.current.delete(id);
      cachedScopes.current.delete(id);
      cachedMeta.current.delete(id);
    }
  }

  return items.map((item, index) => {
    const itemId = ids[index];

    // Reuse or create this item's proxy, then refresh its data so edited /
    // shifted items stay current.
    let itemProxy = proxies.current.get(itemId);
    if (!itemProxy) {
      itemProxy = createProxyScope({ item, index, id: itemId });
      proxies.current.set(itemId, itemProxy);
    }
    (itemProxy as Record<string, unknown>).item = item;
    (itemProxy as Record<string, unknown>).index = index;

    const prevMeta = cachedMeta.current.get(itemId);
    let itemScopes = cachedScopes.current.get(itemId);
    if (!itemScopes || !prevMeta || prevMeta.item !== item || prevMeta.index !== index) {
      itemScopes = { ...scopes, [list.as]: itemProxy };
      cachedScopes.current.set(itemId, itemScopes);
      cachedMeta.current.set(itemId, { item, index });
    }

    return { itemId, itemProxy, itemScopes };
  });
}
