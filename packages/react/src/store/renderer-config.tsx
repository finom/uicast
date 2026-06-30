"use client";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { RendererConfig } from "../types";

const RendererConfigContext = createContext<RendererConfig | null>(null);

/**
 * Shares one config — fallback UI (`defaultComponents`) and the expression
 * allow-list extension (`allowedGlobals`) — across every <Renderer> beneath it.
 * Multiple renderers can sit under a single provider; a renderer with no
 * provider falls back to the engine defaults.
 */
export function RendererConfigProvider({
  defaultComponents,
  allowedGlobals,
  children,
}: RendererConfig & { children: ReactNode }) {
  const value = useMemo(
    () => ({ defaultComponents, allowedGlobals }),
    [defaultComponents, allowedGlobals],
  );
  return (
    <RendererConfigContext.Provider value={value}>
      {children}
    </RendererConfigContext.Provider>
  );
}

export const useRendererConfig = (): RendererConfig =>
  useContext(RendererConfigContext) ?? {};
