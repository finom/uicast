"use client";
import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
} from "react";
import type { ComponentEntry } from "@ui-fired/core";
import type { ElementsStore } from "../types";

// ---------------------------------------------------------------------------
// ElementsStore — the structural source of truth for a render tree.
//
// Why this exists: `<Renderer>` rebuilds the elements map (`buildElementsById`)
// on every render, so the map's *identity* churns every streaming tick. If that
// map were threaded down as a prop, `React.memo` could never bail — every entry
// would re-render on every tick (the streaming "storm"). Instead the map lives
// here behind a stable store, and each node subscribes to ITS OWN key via
// `useSyncExternalStore`. `buildElementsById` preserves the per-entry object
// identity of unchanged entries, so `setMap` only notifies the keys that
// actually changed — settled subtrees are never woken, and `memo` keeps them at
// a single render while siblings stream in.
//
// This handles *structural* updates (an entry appears / changes / is removed).
// Reactive *state* updates are orthogonal: they flow through each entry's proxy
// `forceRender` subscription, exactly as before.
// ---------------------------------------------------------------------------

function notify(listeners: Map<string, Set<() => void>>, key: string): void {
  const set = listeners.get(key);
  if (!set) return;
  // Copy before iterating — a listener may unsubscribe during notification.
  for (const listener of [...set]) listener();
}

export function createElementsStore(
  initial: Record<string, ComponentEntry>,
): ElementsStore {
  let map = initial;
  const listeners = new Map<string, Set<() => void>>();

  return {
    get(key) {
      return map[key];
    },
    subscribe(key, listener) {
      let set = listeners.get(key);
      if (!set) {
        set = new Set();
        listeners.set(key, set);
      }
      set.add(listener);
      return () => {
        const current = listeners.get(key);
        if (!current) return;
        current.delete(listener);
        if (current.size === 0) listeners.delete(key);
      };
    },
    setMap(next) {
      const prev = map;
      if (prev === next) return;
      map = next;
      // Notify any key whose element object identity changed (added / replaced)
      // or that disappeared (removed). Unchanged keys keep their reference via
      // `buildElementsById`'s structural sharing, so they are skipped.
      const seen = new Set<string>();
      for (const key in next) {
        seen.add(key);
        if (prev[key] !== next[key]) notify(listeners, key);
      }
      for (const key in prev) {
        if (!seen.has(key)) notify(listeners, key);
      }
    },
  };
}

const ElementsStoreContext = createContext<ElementsStore | null>(null);

export const ElementsStoreProvider = ElementsStoreContext.Provider;

export function useElementsStore(): ElementsStore {
  const store = useContext(ElementsStoreContext);
  if (!store) {
    throw new Error(
      "useElementsStore must be used within an ElementsStoreProvider",
    );
  }
  return store;
}

/**
 * Subscribe to a single element by key. Re-renders the caller only when that
 * key's element identity changes — independent of any parent re-render.
 */
export function useElement(elementKey: string): ComponentEntry | undefined {
  const store = useElementsStore();
  const subscribe = useCallback(
    (listener: () => void) => store.subscribe(elementKey, listener),
    [store, elementKey],
  );
  const getSnapshot = useCallback(() => store.get(elementKey), [
    store,
    elementKey,
  ]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
