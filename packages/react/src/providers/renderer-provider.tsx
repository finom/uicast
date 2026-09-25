"use client";
import { createProxyScope, type EntryError, type ExpressionEvaluator, type UrlPolicy } from "@uicast/core";
import { createContext, type ReactNode, useContext, useMemo, useRef, useState } from "react";
import { engineOf } from "../impl/engine";
import { RootFragmentImpl } from "../render/root-fragment";
import type { ComponentImplementation, FallbackComponents, InitFn, RendererProviderProps, Scopes } from "../types";
import { ConfirmHost } from "./confirm";

// What every element reads to render. A context of its own, so an `init` change does not re-render every element.
export type RendererRegistry = {
  implementations: Record<string, ComponentImplementation>;
  fallbackComponents?: FallbackComponents;
  evaluator: ExpressionEvaluator;
  urlPolicy?: UrlPolicy;
  onError?: (error: EntryError) => void;
};

type RendererGroup = {
  scopes: Scopes;
  // Latched to run once: the first renderer's seed pass runs it, the rest await.
  init?: InitFn;
};

const RendererRegistryContext = createContext<RendererRegistry | null>(null);
const RendererGroupContext = createContext<RendererGroup | null>(null);

export const RendererRegistryProvider = RendererRegistryContext.Provider;

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
  const [scopes] = useState<Scopes>(() => ({ root: createProxyScope({}) }));
  // Latched before the call, so an `init` that throws is not run again.
  const initRun = useRef<{ result?: unknown } | null>(null);
  const group = useMemo<RendererGroup>(() => {
    if (!init) return { scopes };
    return {
      scopes,
      init: (ctx) => {
        if (initRun.current === null) {
          initRun.current = {};
          initRun.current.result = init(ctx);
        }
        return initRun.current.result;
      },
    };
  }, [scopes, init]);

  // A duplicate name throws, as in the prompt builder. Replace a catalog component by filtering its name out.
  const byName = useMemo(() => {
    // Null prototype: a model-written name like "constructor" finds nothing.
    const map: Record<string, ComponentImplementation> = Object.create(null);
    for (const impl of implementations) {
      if (impl.def.name in map)
        throw new Error(`[uicast] Duplicate component name "${impl.def.name}" in implementations.`);
      // Throws here, not at first render, for an object `createComponentImplementation` did not make.
      engineOf(impl);
      map[impl.def.name] = impl;
    }
    map.RootFragment = RootFragmentImpl;
    return map;
  }, [implementations]);
  const registry = useMemo<RendererRegistry>(
    () => ({ implementations: byName, fallbackComponents, evaluator, urlPolicy, onError }),
    [byName, fallbackComponents, evaluator, urlPolicy, onError],
  );

  return (
    <RendererGroupContext.Provider value={group}>
      <RendererRegistryProvider value={registry}>
        <ConfirmHost confirm={fallbackComponents?.confirm}>{children}</ConfirmHost>
      </RendererRegistryProvider>
    </RendererGroupContext.Provider>
  );
}

const required = <T,>(value: T | null): T => {
  if (value === null)
    throw new Error("[uicast] <EntriesRenderer> and <DocumentSkeleton> must be rendered inside a <RendererProvider>.");
  return value;
};

export const useRendererGroup = (): RendererGroup => required(useContext(RendererGroupContext));

export const useRendererRegistry = (): RendererRegistry => required(useContext(RendererRegistryContext));
