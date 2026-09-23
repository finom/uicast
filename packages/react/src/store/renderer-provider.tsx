"use client";
import {
  createContext,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { createProxyScope } from "@uicast/core";
import { engineOf } from "../impl/engine";
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
  scopes: Scopes;
  // Latched to run once: the first renderer's seed pass runs it, the rest await.
  init?: InitFn;
};

const RendererGroupContext = createContext<RendererGroup | null>(null);

// Shared scopes: every renderer beneath behaves as one app.
export function RendererProvider({
  implementations,
  fallbackComponents,
  evaluator,
  urlPolicy,
  onError,
  init,
  children,
}: RendererProviderProps & { children: ReactNode }) {
  // `init` may assign more named scopes onto this object.
  const scopesRef = useRef<Scopes | null>(null);
  if (!scopesRef.current) scopesRef.current = { root: createProxyScope({}) };
  const scopes = scopesRef.current;

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

  // A duplicate name throws, as in the prompt builder. Replace a catalog component by filtering its name out.
  const implementationsByName = useMemo(() => {
    // Null prototype: a model-written name like "constructor" finds nothing.
    const map: Record<string, ComponentImplementation> = Object.create(null);
    for (const impl of implementations) {
      if (impl.def.name in map) {
        throw new Error(
          `[uicast] Duplicate component name "${impl.def.name}" in implementations.`,
        );
      }
      // Throws here, not at first render, for an object `createComponentImplementation` did not make.
      engineOf(impl);
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

export function useRendererGroup(): RendererGroup {
  const group = useContext(RendererGroupContext);
  if (!group) {
    throw new Error(
      "[uicast] <EntriesRenderer> must be rendered inside a <RendererProvider>.",
    );
  }
  return group;
}
