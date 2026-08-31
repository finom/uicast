"use client";
import { memo, useLayoutEffect, useMemo, useRef } from "react";
import { buildElementsByKey, type ComponentEntry } from "@uicast/core";
import type { EntriesRendererProps, ElementsStore } from "../types";
import { createElementsStore, ElementsStoreProvider } from "../store/elements-store";
import { useRendererGroup } from "../store/renderer-provider";
import { ROOT_FRAGMENT_KEY } from "./root-fragment-impl";
import { EntryRenderer } from "./entry-renderer";

/**
 * Renders one JSONLines entry tree against the group store provided by the
 * nearest <RendererProvider>. It owns no state of its own — every
 * EntriesRenderer under the same provider shares the same `root` scope, so
 * documents can read and write each other's state by path.
 */
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

  // Roots always get a synthetic, invisible RootFragment wrapper — consistent
  // topology, one `init` mount point per document. Its OBJECT IDENTITY must be
  // stable while the root set is unchanged: the seed hook pins one `init`
  // attempt per entry object, so a fresh object per render would retry a
  // failed `init` on every stream tick. Hence keyed by content, not closure.
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

  // The store lives across renders; refresh it after commit so swapping the map
  // wakes only the keys that changed, not settled nodes.
  const storeRef = useRef<ElementsStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = createElementsStore(elementsWithRootFragment);
  }
  useLayoutEffect(() => {
    storeRef.current?.setMap(elementsWithRootFragment);
  }, [elementsWithRootFragment]);

  return (
    <ElementsStoreProvider value={storeRef.current}>
      <EntryRenderer
        key={ROOT_FRAGMENT_KEY}
        elementKey={ROOT_FRAGMENT_KEY}
        scopes={scopes}
        init={init}
      />
    </ElementsStoreProvider>
  );
});
