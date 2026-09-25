import { useRef } from "react";
import type { ComponentListEntry } from "@uicast/core";
import { createRowScope, type RowScope } from "@uicast/core/internal";
import type { Scopes } from "../types";

type ItemId = string | number;

type ItemRow = {
  itemId: ItemId;
  itemScopes: Scopes;
};

// A repeated id gets a suffix, so two rows never share one window. Ids compare as strings, as React keys and
// `$$id`-keyed maps do: `1` and `"1"` are one id.
function getItemId(keyBy: string | undefined, item: unknown, index: number, seen: Set<string>): ItemId {
  let id: ItemId = index;
  if (keyBy !== undefined && typeof item === "object" && item !== null && Object.hasOwn(item, keyBy)) {
    const value: unknown = Reflect.get(item, keyBy);
    if (typeof value === "string" || typeof value === "number") id = value;
  }
  let unique = id;
  for (let n = 2; seen.has(String(unique)); n++) unique = `${id}#${n}`;
  seen.add(String(unique));
  return unique;
}

type CachedRow = {
  row: RowScope;
  // The row's scopes object; null forces a rebuild (parent scopes or the `as` name changed).
  scopes: Scopes | null;
  item: unknown;
  index: number;
};

// Cached by id, so a row keeps its identity across reorders and refetches.
export function useItemScopes(scopes: Scopes, list: ComponentListEntry, items: unknown[]): ItemRow[] {
  // Keyed by the id's string form, like `seen`.
  const cache = useRef<Map<string, CachedRow>>(new Map());
  const prevScopes = useRef<Scopes | null>(null);
  const prevAs = useRef<string | null>(null);

  if (prevScopes.current !== scopes || prevAs.current !== list.as) {
    for (const cached of cache.current.values()) cached.scopes = null;
    prevScopes.current = scopes;
    prevAs.current = list.as;
  }

  const seen = new Set<string>();
  const ids = items.map((item, index) => getItemId(list.keyBy, item, index, seen));

  for (const [id, cached] of cache.current) {
    if (seen.has(id)) continue;
    cached.row.detach();
    cache.current.delete(id);
  }

  return items.map((item, index) => {
    const itemId = ids[index];
    let cached = cache.current.get(String(itemId));
    if (!cached) {
      cached = { row: createRowScope(), scopes: null, item, index };
      cache.current.set(String(itemId), cached);
    }
    // Silent: this runs during render.
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
