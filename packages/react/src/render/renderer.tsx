"use client";
import { memo, useLayoutEffect, useMemo, useRef } from "react";
import {
  createProxyScope,
  buildElementsById,
  type ComponentEntry,
  type ReactiveProxy,
} from "@ui-fired/core";
import { ConfirmHost } from "../providers/confirm";
import type {
  ComponentImplementation,
  ElementsStore,
  RendererProps,
} from "../types";
import { createElementsStore, ElementsStoreProvider } from "../store/elements-store";
import { RootFragmentImpl, ROOT_FRAGMENT_KEY } from "./root-fragment-impl";
import { EntryRenderer } from "./entry-renderer";
import { RendererRegistryProvider } from "../store/renderer-registry";
import { useRendererConfig } from "../store/renderer-config";

/**
 * Renders a JSONLines entry tree. Each mounted Renderer owns an isolated
 * reactive `root` scope.
 */
export const Renderer = memo(function Renderer({
  implementations,
  entries,
  functions,
  init,
  onError,
}: RendererProps) {
  const { defaultComponents, allowedGlobals } = useRendererConfig();
  const rootRef = useRef<ReactiveProxy | null>(null);
  if (!rootRef.current) rootRef.current = createProxyScope({});
  const scopes = useMemo(() => ({ root: rootRef.current! }), []);

  // name→implementation lookup. Last entry wins on a duplicate (and logs);
  // RootFragment is merged in last as host infrastructure.
  const implementationsByName = useMemo(() => {
    const map: Record<string, ComponentImplementation> = {};
    for (const impl of implementations) {
      if (impl.def.name in map) {
        console.error(
          `[ui-fired] Duplicate component name "${impl.def.name}" in implementations — the later one wins.`,
        );
      }
      map[impl.def.name] = impl;
    }
    map.RootFragment = RootFragmentImpl;
    return map;
  }, [implementations]);

  const registryValue = useMemo(
    () => ({
      implementations: implementationsByName,
      defaultComponents,
      functions,
      allowedGlobals,
      onError,
    }),
    [implementationsByName, defaultComponents, functions, allowedGlobals, onError],
  );

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
  // `init` has one mount point. It renders children directly, so it's invisible.
  // Its OBJECT IDENTITY must be stable while the root set is unchanged: the seed
  // hook pins one `init` attempt per entry object (a fresh object per render
  // would retry a failed `init` on every stream tick), and the store notifies
  // (and the root boundary resets) on identity change.
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
      <RendererRegistryProvider value={registryValue}>
        <ConfirmHost confirm={defaultComponents?.confirm}>
          <EntryRenderer
            key={ROOT_FRAGMENT_KEY}
            elementKey={ROOT_FRAGMENT_KEY}
            scopes={scopes}
            init={init}
          />
        </ConfirmHost>
      </RendererRegistryProvider>
    </ElementsStoreProvider>
  );
});
