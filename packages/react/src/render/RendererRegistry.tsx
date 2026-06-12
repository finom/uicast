"use client";
import { createContext, useContext } from "react";
import type React from "react";
import type { StandardTool } from "standard-tool";
import type { ConfirmComponentProps } from "../components/confirm";
import type { AIComponentRenderer } from "./createAIComponentRenderer";

// Props for the `unknown` slot — the element's `component` name had no match
// in the catalog.
export type UnknownComponentProps = {
  componentName: string;
  elementKey: string;
};

// Props for the `error` slot. `elementKey` is present when the engine renders
// the slot for a specific element; a standalone <ErrorBoundary> leaves it
// unset.
export type ErrorComponentProps = {
  error: Error;
  elementKey?: string;
};

// Host-supplied visual components ("chrome"): named overrides for the engine's
// own system UI, passed in via the `<Renderer components={...}>` prop. Distinct
// from `renderers` (the catalog component implementations) — these are the
// engine's own fallback UI. Extensible: add a field here + one resolution site
// (RecursiveRenderer for per-node chrome, `<Renderer>` for tree-level chrome
// like `confirm`).
// - `placeholder` renders while a node's chunk hasn't streamed in yet (and as
//   the Suspense fallback while async defaults load); null = render nothing.
// - `confirm` is the modal that resolves callback steps carrying `confirm:`;
//   omitted → the browser-native `window.confirm`. Stateless: the engine owns
//   the pending state and drives it as a controlled dialog (see
//   `ConfirmComponentProps`).
// - `unknown` replaces an element whose `component` has no renderer in the
//   catalog.
// - `error` replaces an element whose render threw (and the not-a-list misuse
//   of a list key).
// The `unknown`/`error` defaults are bare inline-styled divs — zero CSS
// dependencies; the shadcn-styled versions ship in @ui-fired/catalog
// (`UnknownComponent`, `RenderError`) for hosts to attach manually.
export type RendererComponents = {
  placeholder?: () => React.ReactElement | null;
  confirm?: (props: ConfirmComponentProps) => React.ReactElement | null;
  unknown?: (props: UnknownComponentProps) => React.ReactElement | null;
  error?: (props: ErrorComponentProps) => React.ReactElement | null;
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
