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
  /** The shared scopes — one `root` proxy for every renderer in the group. */
  scopes: Scopes;
  /**
   * Group-level `init`, latched to run once no matter how many renderers
   * mount. The first renderer's seed pass executes it (keeping the existing
   * error classification and Suspense gating); the rest await the same result.
   */
  init?: InitFn;
};

const RendererGroupContext = createContext<RendererGroup | null>(null);

/**
 * The host side of uicast's React binding: provides the component registry,
 * host functions, fallback UI, and — critically — ONE shared reactive store to
 * every <EntriesRenderer> beneath it. All renderers in the group read and
 * write the same `root` scope, so state written by one document (a chat
 * block, a page section) is live in all of them — a group of documents
 * behaves as one app with one store, where the same path means the same
 * data in every document.
 */
export function RendererProvider({
  implementations,
  defaultComponents,
  functions,
  allowedGlobals,
  onError,
  init,
  scopes: extraScopes,
  children,
}: RendererProviderProps & { children: ReactNode }) {
  // The group's root proxy — created once, lives as long as the provider.
  const rootRef = useRef<ReactiveProxy | null>(null);
  if (!rootRef.current) rootRef.current = createProxyScope({});
  // biome-ignore lint/correctness/useExhaustiveDependencies: extra host scopes are captured on mount by design — the store's identity must not churn
  const scopes = useMemo<Scopes>(
    () => ({ ...extraScopes, root: rootRef.current! }),
    [],
  );

  // Run-once latch for the group init. Execution stays inside the first
  // renderer's seed pass — that keeps host-init failures classified and the
  // Suspense gate working — while every other renderer awaits the same result.
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

  // name→implementation lookup. Last entry wins on a duplicate (and logs);
  // RootFragment is merged in last as host infrastructure.
  const implementationsByName = useMemo(() => {
    const map: Record<string, ComponentImplementation> = {};
    for (const impl of implementations) {
      if (impl.def.name in map) {
        console.error(
          `[uicast] Duplicate component name "${impl.def.name}" in implementations — the later one wins.`,
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
      defaultComponents,
      functions,
      allowedGlobals,
      onError,
    }),
    [implementationsByName, defaultComponents, functions, allowedGlobals, onError],
  );

  return (
    <RendererGroupContext.Provider value={group}>
      <RendererRegistryProvider value={registryValue}>
        <ConfirmHost confirm={defaultComponents?.confirm}>{children}</ConfirmHost>
      </RendererRegistryProvider>
    </RendererGroupContext.Provider>
  );
}

/** The shared group store, or a clear error outside a <RendererProvider>. */
export function useRendererGroup(): RendererGroup {
  const group = useContext(RendererGroupContext);
  if (!group) {
    throw new Error(
      "[uicast] <EntriesRenderer> must be rendered inside a <RendererProvider>.",
    );
  }
  return group;
}
