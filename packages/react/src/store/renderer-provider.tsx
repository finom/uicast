"use client";
import {
  createContext,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { createProxyScope, type ReactiveProxy } from "@uicast/core";
import { ConfirmHost } from "../providers/confirm";
import { RootFragmentImpl } from "../render/root-fragment-impl";
import type {
  ComponentImplementation,
  InitFn,
  RendererProviderProps,
  RendererRegistry,
  Scopes,
} from "../types";
import { RendererRegistryProvider } from "./renderer-registry";

type RendererGroup = {
  // The shared scopes — one `root` proxy for every renderer in the group.
  scopes: Scopes;
  // Group-level `init`, latched to run once; the first renderer's seed pass executes it, the rest await.
  init?: InitFn;
};

const RendererGroupContext = createContext<RendererGroup | null>(null);

// Host side of the binding: registry, evaluator, fallback UI, and ONE shared store — every renderer beneath behaves as one app.
export function RendererProvider({
  implementations,
  fallbackComponents,
  evaluator,
  urlPolicy,
  onError,
  init,
  children,
}: RendererProviderProps & { children: ReactNode }) {
  // The group's root proxy — created once, lives as long as the provider.
  const rootRef = useRef<ReactiveProxy | null>(null);
  if (!rootRef.current) rootRef.current = createProxyScope({});
  const root = rootRef.current;
  // One stable store for the group's lifetime — root captured once. `init` can
  // assign more named scopes onto this object.
  const scopes = useMemo<Scopes>(() => ({ root }), [root]);

  // Run-once latch — see RendererGroup.init.
  const initBoxRef = useRef<{ ran: boolean; result: unknown }>({
    ran: false,
    result: undefined,
  });
  const group = useMemo<RendererGroup>(() => {
    const box = initBoxRef.current;
    return {
      scopes,
      init: init
        ? (ctx) => {
            if (!box.ran) {
              box.ran = true;
              box.result = init(ctx);
            }
            return box.result;
          }
        : undefined,
    };
  }, [scopes, init]);

  // name→implementation lookup. A duplicate name throws, matching the prompt
  // builder — an array carrying one could never have reached a working
  // generation. Replace a catalog component by filtering its name out, not
  // appending over it. RootFragment is merged in last as host infrastructure.
  const implementationsByName = useMemo(() => {
    const map: Record<string, ComponentImplementation> = {};
    for (const impl of implementations) {
      if (impl.def.name in map) {
        throw new Error(
          `[uicast] Duplicate component name "${impl.def.name}" in implementations.`,
        );
      }
      map[impl.def.name] = impl;
    }
    map.RootFragment = RootFragmentImpl;
    return map;
  }, [implementations]);

  const registryValue = useMemo<RendererRegistry>(
    () => ({
      implementations: implementationsByName,
      fallbackComponents,
      evaluator,
      urlPolicy,
      onError,
    }),
    [implementationsByName, fallbackComponents, evaluator, urlPolicy, onError],
  );

  return (
    <RendererGroupContext.Provider value={group}>
      <RendererRegistryProvider value={registryValue}>
        <ConfirmHost confirm={fallbackComponents?.confirm}>{children}</ConfirmHost>
      </RendererRegistryProvider>
    </RendererGroupContext.Provider>
  );
}

// The shared group store, or a clear error outside a <RendererProvider>.
export function useRendererGroup(): RendererGroup {
  const group = useContext(RendererGroupContext);
  if (!group) {
    throw new Error(
      "[uicast] <EntriesRenderer> must be rendered inside a <RendererProvider>.",
    );
  }
  return group;
}
