"use client";
import { createContext, useContext } from "react";
import type React from "react";
import type { StandardTool } from "standard-tool";
import type { AIComponentRenderer } from "./createAIComponentRenderer";

export type DefaultPlaceholderComponent = () => React.ReactElement | null;

export type RendererRegistry = {
  renderers: Record<string, AIComponentRenderer>;
  defaultPlaceholder?: DefaultPlaceholderComponent;
  // Host-provided callables exposed as bare identifiers inside every
  // evaluate() invocation under this provider. The wrapping <Renderer> prop
  // carries them in; every evaluate site reads them from useRendererRegistry
  // and passes them through as the third arg.
  functions?: StandardTool[];
};

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

const NullPlaceholder: DefaultPlaceholderComponent = () => null;

export const useDefaultPlaceholder = (): DefaultPlaceholderComponent => {
  const ctx = useContext(RendererRegistryContext);
  return ctx?.defaultPlaceholder ?? NullPlaceholder;
};
