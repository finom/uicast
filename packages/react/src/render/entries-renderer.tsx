"use client";
import { memo, useLayoutEffect, useMemo, useRef } from "react";
import { buildElementsByKey, type ComponentEntry } from "@uicast/core";
import type { EntriesRendererProps, ElementsStore } from "../types";
import { createElementsStore, ElementsStoreProvider } from "../store/elements-store";
import { useRendererGroup } from "../store/renderer-provider";
import { ROOT_FRAGMENT_KEY } from "./root-fragment-impl";
import { EntryRenderer } from "./entry-renderer";

// Every renderer under one provider shares its scopes.
export const EntriesRenderer = memo(function EntriesRenderer({
  entries,
}: EntriesRendererProps) {
  const { scopes, init } = useRendererGroup();

  const { elementsById, rootKeys, rootKeysSignature } = useMemo(() => {
    const map = buildElementsByKey(entries);
    // An entry is a root iff nothing references its key as a child.
    const childKeys = new Set<string>();
    for (const line of entries) {
      for (const childKey of line.children ?? []) childKeys.add(childKey);
    }
    const seen = new Set<string>();
    const roots: string[] = [];
    for (const line of entries) {
      if (childKeys.has(line.key) || seen.has(line.key)) continue;
      seen.add(line.key);
      roots.push(line.key);
    }
    return {
      elementsById: map,
      rootKeys: roots,
      rootKeysSignature: JSON.stringify(roots),
    };
  }, [entries]);

  // Identity must stay stable while the root set is unchanged: the seed hook pins one `init` attempt per entry object.
  // biome-ignore lint/correctness/useExhaustiveDependencies: content-keyed on rootKeysSignature by design — see above
  const syntheticRootFragment: ComponentEntry = useMemo(
    () => ({
      key: ROOT_FRAGMENT_KEY,
      component: "RootFragment",
      children: rootKeys,
    }),
    [rootKeysSignature],
  );
  const elementsWithRootFragment = useMemo(
    () => ({
      ...elementsById,
      [ROOT_FRAGMENT_KEY]: syntheticRootFragment,
    }),
    [elementsById, syntheticRootFragment],
  );

  // Refreshed after commit, so swapping the map wakes only the keys that changed.
  const storeRef = useRef<ElementsStore | null>(null);
  if (!storeRef.current) storeRef.current = createElementsStore(elementsWithRootFragment);
  const store = storeRef.current;
  useLayoutEffect(() => {
    store.setMap(elementsWithRootFragment);
  }, [store, elementsWithRootFragment]);

  return (
    <ElementsStoreProvider value={store}>
      <EntryRenderer
        elementKey={ROOT_FRAGMENT_KEY}
        scopes={scopes}
        init={init}
      />
    </ElementsStoreProvider>
  );
});
