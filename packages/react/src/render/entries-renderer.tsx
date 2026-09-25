"use client";
import { buildElementsByKey, type ComponentEntry } from "@uicast/core";
import { memo, useLayoutEffect, useMemo, useState } from "react";
import { createElementsStore, ElementsStoreProvider } from "../providers/elements-store";
import { useRendererGroup } from "../providers/renderer-provider";
import type { EntriesRendererProps } from "../types";
import { rootKeys } from "./document-skeleton";
import { EntryRenderer } from "./entry-renderer";
import { ROOT_FRAGMENT_KEY } from "./root-fragment";

/**
 * Mounts a document inside a `<RendererProvider>`. Every renderer under one provider shares its scopes. Memoized on
 * the `entries` array, so pass a new array for each streamed entry.
 *
 * @example
 * <RendererProvider implementations={impls} evaluator={evaluator}>
 *   <EntriesRenderer entries={entries} />
 * </RendererProvider>;
 *
 * @example
 * setEntries((prev) => [...prev, entry]); // a new array; settled subtrees do not re-render
 */
export const EntriesRenderer = memo(function EntriesRenderer({ entries }: EntriesRendererProps) {
  const { scopes, init } = useRendererGroup();

  const { roots, signature } = useMemo(() => {
    const roots = rootKeys(entries);
    return { roots, signature: JSON.stringify(roots) };
  }, [entries]);
  // Identity must stay stable while the root set is unchanged: the seed hook pins one `init` attempt per entry object.
  // biome-ignore lint/correctness/useExhaustiveDependencies: content-keyed on the roots' signature by design — see above
  const rootFragment = useMemo<ComponentEntry>(
    () => ({ key: ROOT_FRAGMENT_KEY, component: "RootFragment", children: roots }),
    [signature],
  );
  const elements = useMemo(
    () => ({ ...buildElementsByKey(entries), [ROOT_FRAGMENT_KEY]: rootFragment }),
    [entries, rootFragment],
  );

  // Refreshed after commit, so swapping the map wakes only the keys that changed.
  const [store] = useState(() => createElementsStore(elements));
  useLayoutEffect(() => store.setMap(elements), [store, elements]);

  return (
    <ElementsStoreProvider value={store}>
      <EntryRenderer elementKey={ROOT_FRAGMENT_KEY} scopes={scopes} init={init} />
    </ElementsStoreProvider>
  );
});
