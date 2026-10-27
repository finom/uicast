import type { ComponentEntry } from "@uicast/core";
import { createContext, useCallback, useContext, useSyncExternalStore } from "react";

// Each node subscribes to its own key, so settled subtrees don't re-render while siblings stream in.
export interface ElementsStore {
  get(key: string): ComponentEntry | undefined;
  // The one `children` slot a key renders in: the first that lists it, in entry order.
  slotOf(key: string): string | undefined;
  subscribe(key: string, listener: () => void): () => void;
  // Notifies only the keys whose element identity or slot changed.
  setMap(next: Record<string, ComponentEntry>): void;
}

// The `index`th child slot of `parentKey`.
export const slotId = (parentKey: string, index: number) => `${index}:${parentKey}`;

function slotsOf(map: Record<string, ComponentEntry>): Map<string, string> {
  const slots = new Map<string, string>();
  for (const key in map) {
    const children = map[key].children;
    if (!Array.isArray(children)) continue;
    children.forEach((child, index) => {
      if (!slots.has(child)) slots.set(child, slotId(key, index));
    });
  }
  return slots;
}

export function createElementsStore(initial: Record<string, ComponentEntry>): ElementsStore {
  let map = initial;
  let slots = slotsOf(initial);
  const listeners = new Map<string, Set<() => void>>();
  const notify = (key: string) => {
    for (const listener of [...(listeners.get(key) ?? [])]) listener();
  };

  return {
    get: (key) => (Object.hasOwn(map, key) ? map[key] : undefined),
    slotOf: (key) => slots.get(key),
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
      const prevSlots = slots;
      map = next;
      slots = slotsOf(next);
      const changed = new Set<string>();
      for (const key in next) if (prev[key] !== next[key]) changed.add(key);
      for (const key in prev) if (!Object.hasOwn(next, key)) changed.add(key);
      for (const [key, slot] of slots) if (prevSlots.get(key) !== slot) changed.add(key);
      for (const key of prevSlots.keys()) if (!slots.has(key)) changed.add(key);
      for (const key of changed) notify(key);
    },
  };
}

const ElementsStoreContext = createContext<ElementsStore | null>(null);

export const ElementsStoreProvider = ElementsStoreContext.Provider;

function useStore(): ElementsStore {
  const store = useContext(ElementsStoreContext);
  if (!store) throw new Error("[uicast] useElement needs an ElementsStoreProvider above it.");
  return store;
}

// Re-renders only when that key's identity changes.
export function useElement(elementKey: string): ComponentEntry | undefined {
  const store = useStore();
  const subscribe = useCallback((listener: () => void) => store.subscribe(elementKey, listener), [store, elementKey]);
  const getSnapshot = useCallback(() => store.get(elementKey), [store, elementKey]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

// Re-renders when another listing of the key takes over its slot, as a re-emitted parent moves it.
export function useSlot(elementKey: string): string | undefined {
  const store = useStore();
  const subscribe = useCallback((listener: () => void) => store.subscribe(elementKey, listener), [store, elementKey]);
  const getSnapshot = useCallback(() => store.slotOf(elementKey), [store, elementKey]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
