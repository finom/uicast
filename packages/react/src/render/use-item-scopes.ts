import { useRef } from "react";
import type { ComponentListEntry } from "@uicast/core";
import { createRowScope, type RowScope } from "@uicast/core/internal";
import type { Scopes } from "../types";

type ItemId = string | number;

export type ItemRow = {
  itemId: ItemId;
  itemScopes: Scopes;
};

// A row's stable id: the `keyBy` field, else its index. A repeated id gets a
// suffix so two rows never share one window.
function getItemId(keyBy: string | undefined, item: unknown, index: number, seen: Set<ItemId>): ItemId {
  let id: ItemId = index;
  if (keyBy !== undefined) id = ((item as Record<string, unknown>)?.[keyBy] ?? index) as ItemId;
  let unique = id;
  for (let n = 2; seen.has(unique); n++) unique = `${id}#${n}`;
  seen.add(unique);
  return unique;
}

type CachedRow = {
  row: RowScope;
  // The row's scopes object; null forces a rebuild (parent scopes or the `as` name changed).
  scopes: Scopes | null;
  item: unknown;
  index: number;
};

// One window per list item, cached by id so per-row identity survives
// reordering and refetches; a row's `scopes` object is rebuilt only when its
// element or index changed. Safe with `list: null` (returns `[]`).
export function useItemScopes(
  scopes: Scopes,
  list: ComponentListEntry | null,
  items: unknown[],
): ItemRow[] {
  const cache = useRef<Map<ItemId, CachedRow>>(new Map());
  const prevScopes = useRef<Scopes | null>(null);
  const prevAs = useRef<string | null>(null);

  if (!list) return [];

  if (prevScopes.current !== scopes || prevAs.current !== list.as) {
    for (const cached of cache.current.values()) cached.scopes = null;
    prevScopes.current = scopes;
    prevAs.current = list.as;
  }

  const seen = new Set<ItemId>();
  const ids = items.map((item, index) => getItemId(list.keyBy, item, index, seen));

  for (const [id, cached] of [...cache.current]) {
    if (seen.has(id)) continue;
    cached.row.detach();
    cache.current.delete(id);
  }

  return items.map((item, index) => {
    const itemId = ids[index];
    let cached = cache.current.get(itemId);
    if (!cached) {
      cached = { row: createRowScope(), scopes: null, item, index };
      cache.current.set(itemId, cached);
    }
    // Silent re-point: this runs during render, and an emit would force a
    // subscribed component to render mid-render.
    cached.row.retarget(item, index, itemId);
    cached.row.see(scopes);

    if (!cached.scopes || cached.item !== item || cached.index !== index) {
      cached.scopes = { ...scopes, [list.as]: cached.row.proxy };
      cached.item = item;
      cached.index = index;
    }

    return { itemId, itemScopes: cached.scopes };
  });
}
