import { useRef } from "react";
import type { ComponentListEntry, ReactiveProxy } from "@uicast/core";
import { createRowScope, createRowState, type RowScope, type RowState } from "@uicast/core/internal";
import type { Scopes } from "../types";

type ItemId = string | number;

type ItemRow = {
  itemId: ItemId;
  itemScopes: Scopes;
};

// A repeated id gets a suffix, so two rows never share one window. Ids compare as strings, as React keys and
// id-keyed maps do: `1` and `"1"` are one id.
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
  index: number;
};

type RowStates = Map<string, RowState>;

// Each `scopes.$<as>` holds the states of the lists inside its row, so a nested row keeps its state while the outer
// row leaves the list and comes back.
const nestedStates = new WeakMap<ReactiveProxy, Map<string, RowStates>>();

// `scopes.$<as>` by row id; kept after the row leaves, so a row that comes back finds its state.
function useRowStates(scopes: Scopes, listKey: string): RowStates {
  const own = useRef<RowStates>(new Map());
  let enclosing: ReactiveProxy | undefined;
  for (const scope of Object.values(scopes)) if (nestedStates.has(scope)) enclosing = scope;
  const byList = enclosing && nestedStates.get(enclosing);
  if (!byList) return own.current;
  const states = byList.get(listKey) ?? new Map();
  byList.set(listKey, states);
  return states;
}

function rowState(states: RowStates, id: ItemId): RowState {
  let state = states.get(String(id));
  if (!state) {
    state = createRowState();
    nestedStates.set(state.proxy, new Map());
    states.set(String(id), state);
  }
  return state;
}

// Cached by id, so a row keeps its identity across reorders and refetches. `sources` are the paths `each` reads, where
// a write to an item puts its copy.
export function useItemScopes(
  scopes: Scopes,
  list: ComponentListEntry,
  items: unknown[],
  sources: readonly string[],
): ItemRow[] {
  // Keyed by the id's string form, like `seen`.
  const cache = useRef<Map<string, CachedRow>>(new Map());
  const states = useRowStates(scopes, list.key);
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
      cached = { row: createRowScope(), scopes: null, index };
      cache.current.set(String(itemId), cached);
    }
    // Silent: this runs during render.
    const state = rowState(states, itemId);
    state.retarget(item, index, itemId);
    // A row's own write already moved it and woke its readers.
    const moved = cached.row.retarget(item);
    cached.row.see(scopes, sources);

    if (!cached.scopes || moved || cached.index !== index) {
      cached.scopes = { ...scopes, [list.as]: cached.row.proxy, [`$${list.as}`]: state.proxy };
      cached.index = index;
    }

    return { itemId, itemScopes: cached.scopes };
  });
}
