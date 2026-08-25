"use client";
import { memo, useLayoutEffect, useMemo, useRef } from "react";
import { buildElementsById, type ComponentEntry } from "@uicast/core";
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

  const elementsById = useMemo(() => buildElementsById(entries), [entries]);

  // An entry is a root iff nothing references its key as a child.
  const childKeys = new Set<string>();
  for (const line of entries) {
    for (const childKey of line.children ?? []) childKeys.add(childKey);
  }
  const seenRootKeys = new Set<string>();
  const rootKeys: string[] = [];
  for (const line of entries) {
    if (childKeys.has(line.key) || seenRootKeys.has(line.key)) continue;
    seenRootKeys.add(line.key);
    rootKeys.push(line.key);
  }

  // Always wrap roots in a synthetic RootFragment, so topology is consistent and
  // the group `init` has one mount point per document. It renders children
  // directly, so it's invisible. Its OBJECT IDENTITY must be stable while the
  // root set is unchanged: the seed hook pins one `init` attempt per entry
  // object (a fresh object per render would retry a failed `init` on every
  // stream tick), and the store notifies (and the root boundary resets) on
  // identity change.
  const rootKeysSignature = JSON.stringify(rootKeys);
  // Closes over the current rootKeys but is keyed by content, so the object
  // survives renders where the root set is unchanged.
  // biome-ignore lint/correctness/useExhaustiveDependencies: content-keyed on rootKeysSignature by design — see above
  const syntheticRootFragment: ComponentEntry = useMemo(
    () => ({
      key: ROOT_FRAGMENT_KEY,
      component: "RootFragment",
      children: rootKeys,
    }),
    // content-keyed: rootKeys is rebuilt per render, the signature is stable
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
  });

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
