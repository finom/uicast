"use client";
import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
} from "react";
import type { ComponentEntry } from "uicast";
import type { ElementsStore } from "../types";

function notify(listeners: Map<string, Set<() => void>>, key: string): void {
  const set = listeners.get(key);
  if (!set) return;
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

// Subscribe to one element by key. Re-renders only when that key's identity
// changes, independent of any parent re-render.
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
