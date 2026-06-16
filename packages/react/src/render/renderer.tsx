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
 * Renders a JSONLines entry tree from a host-supplied `implementations` array
 * (the component implementations). Each mounted Renderer owns an isolated
 * reactive `root` scope.
 */
export const Renderer = memo(function Renderer({
  implementations,
  lines,
  functions,
  init,
  systemVisuals,
}: RendererProps) {
  // Per-instance root scope — isolated reactive state per mounted Renderer.
  // (Lazy-init via ref, like the structural store below.)
  const rootRef = useRef<ReactiveProxy | null>(null);
  if (!rootRef.current) rootRef.current = createProxyScope({});
  const scopes = useMemo(() => ({ root: rootRef.current! }), []);

  // Build the name→implementation lookup the registry needs from the
  // `implementations` array (the shape `element.component` is matched against).
  // Last entry wins on a duplicate name — so `[...base, Override]` overrides —
  // and we log it. The host RootFragment implementation is always merged in last (host
  // infrastructure; overrides any consumer-supplied one). Memoised so identity
  // tracks `implementations`.
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

  // Stable registry value — its identity drives child re-renders, so we only
  // want a new object when the host actually swaps implementations/functions/systemVisuals.
  const registryValue = useMemo(
    () => ({ implementations: implementationsByName, systemVisuals, functions }),
    [implementationsByName, systemVisuals, functions],
  );

  const elementsById = buildElementsById(lines);

  // Root entries are derived structurally (there is no `op` field): an entry is a
  // root iff no other entry references its `key` in a `children` array. Collect
  // every referenced child key first, then keep the entries nothing points at.
  // Walk in emission order and dedup by key.
  const childKeys = new Set<string>();
  for (const line of lines) {
    for (const childKey of line.children ?? []) childKeys.add(childKey);
  }
  const seenRootKeys = new Set<string>();
  const rootKeys: string[] = [];
  for (const line of lines) {
    if (childKeys.has(line.key) || seenRootKeys.has(line.key)) continue;
    seenRootKeys.add(line.key);
    rootKeys.push(line.key);
  }

  // Always wrap roots in a synthetic RootFragment entry — even when `init` is
  // undefined — so tree topology stays consistent and `init` has exactly one
  // mount point to attach to. Visually identical (RootFragment renders children
  // directly via React.Fragment).
  const syntheticRootFragment: ComponentEntry = {
    key: ROOT_FRAGMENT_KEY,
    component: "RootFragment",
    children: rootKeys,
  };
  const elementsWithRootFragment = {
    ...elementsById,
    [ROOT_FRAGMENT_KEY]: syntheticRootFragment,
  };

  // Structural store lives across renders; the per-node `useElement`
  // subscriptions read from it. We refresh it AFTER commit (layout effect) so
  // swapping the map notifies only the keys that changed — settled nodes never
  // re-render while later entries stream in.
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
        <ConfirmHost confirm={systemVisuals?.confirm}>
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
