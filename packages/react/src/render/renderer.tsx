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

/**
 * Renders a JSONLines entry tree. Each mounted Renderer owns an isolated
 * reactive `root` scope.
 */
export const Renderer = memo(function Renderer({
  implementations,
  entries,
  functions,
  init,
  overrides,
}: RendererProps) {
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
    () => ({ implementations: implementationsByName, overrides, functions }),
    [implementationsByName, overrides, functions],
  );

  const elementsById = buildElementsById(entries);

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
  const syntheticRootFragment: ComponentEntry = {
    key: ROOT_FRAGMENT_KEY,
    component: "RootFragment",
    children: rootKeys,
  };
  const elementsWithRootFragment = {
    ...elementsById,
    [ROOT_FRAGMENT_KEY]: syntheticRootFragment,
  };

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
        <ConfirmHost confirm={overrides?.confirm}>
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
