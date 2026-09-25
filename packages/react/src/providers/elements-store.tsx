import type { ComponentEntry } from "@uicast/core";
import { createContext, useCallback, useContext, useSyncExternalStore } from "react";

// Each node subscribes to its own key, so settled subtrees don't re-render while siblings stream in.
export interface ElementsStore {
  get(key: string): ComponentEntry | undefined;
  subscribe(key: string, listener: () => void): () => void;
  // Notifies only the keys whose element identity changed.
  setMap(next: Record<string, ComponentEntry>): void;
}

export function createElementsStore(initial: Record<string, ComponentEntry>): ElementsStore {
  let map = initial;
  const listeners = new Map<string, Set<() => void>>();
  const notify = (key: string) => {
    for (const listener of [...(listeners.get(key) ?? [])]) listener();
  };

  return {
    get: (key) => (Object.hasOwn(map, key) ? map[key] : undefined),
    subscribe(key, listener) {
      const set = listeners.get(key) ?? new Set();
      listeners.set(key, set.add(listener));
      return () => {
        set.delete(listener);
        if (set.size === 0 && listeners.get(key) === set) listeners.delete(key);
      };
    },
    setMap(next) {
      const prev = map;
      if (prev === next) return;
      map = next;
      for (const key in next) if (prev[key] !== next[key]) notify(key);
      for (const key in prev) if (!Object.hasOwn(next, key)) notify(key);
    },
  };
}

const ElementsStoreContext = createContext<ElementsStore | null>(null);

export const ElementsStoreProvider = ElementsStoreContext.Provider;

// Re-renders only when that key's identity changes.
export function useElement(elementKey: string): ComponentEntry | undefined {
  const store = useContext(ElementsStoreContext);
  if (!store) throw new Error("[uicast] useElement needs an ElementsStoreProvider above it.");
  const subscribe = useCallback((listener: () => void) => store.subscribe(elementKey, listener), [store, elementKey]);
  const getSnapshot = useCallback(() => store.get(elementKey), [store, elementKey]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
