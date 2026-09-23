import { createContext, useContext } from "react";
import type { RendererRegistry } from "../types";

const RendererRegistryContext = createContext<RendererRegistry | null>(null);

export const RendererRegistryProvider = RendererRegistryContext.Provider;

export const useRendererRegistry = (): RendererRegistry => {
  const ctx = useContext(RendererRegistryContext);
  if (!ctx) {
    throw new Error(
      "useRendererRegistry must be used within a RendererRegistryProvider",
    );
  }
  return ctx;
};
