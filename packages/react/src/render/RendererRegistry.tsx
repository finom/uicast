"use client";
import { createContext, useContext } from "react";
import type React from "react";
import type { StandardTool } from "standard-tool";
import type { AIComponentRenderer } from "./createAIComponentRenderer";

// Host-supplied visual components ("chrome"): named overrides for the engine's
// own system UI, passed in via the `<Renderer components={...}>` prop. Distinct
// from `renderers` (the catalog component implementations) — these are the
// engine's own fallback UI. Extensible: add a field here + one resolution site
// in RecursiveRenderer to introduce a new slot (next: `unknown`). Only
// `placeholder` is wired today — it renders while a node's chunk hasn't
// streamed in yet (and as the Suspense fallback while async defaults load), and
// returns an element or null (null = render nothing).
export type RendererComponents = {
  placeholder?: () => React.ReactElement | null;
};

export type RendererRegistry = {
  renderers: Record<string, AIComponentRenderer>;
  // Host-supplied system/chrome component overrides (see `RendererComponents`).
  // Stabilised by `<Renderer>` so its identity doesn't churn this context value
  // (which would re-render every node).
  components?: RendererComponents;
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
