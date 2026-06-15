import { render } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { z } from "zod";
import type { StandardTool } from "standard-tool";
import { createComponentDefinition, createProxyScope, buildElementsById, type ComponentEntry } from "@ui-fired/core";
import {
  type ComponentImplementation,
  createComponentImplementation,
} from "@ui-fired/react";
import { RecursiveRenderer } from "@ui-fired/react";
import {
  RendererRegistryProvider,
  type RendererComponents,
} from "@ui-fired/react";
import { createElementsStore, ElementsStoreProvider } from "@ui-fired/react";

// Lightweight test implementations wired the same way real catalog components are.

const boxDef = createComponentDefinition({
  name: "Box",
  description: "A plain div with optional text",
  props: z.object({
    text: z.string().optional(),
    className: z.string().optional(),
  }),
});

export const boxRenderer = createComponentImplementation({
  def: boxDef,
  render: ({ text, className, children, generatedKey }) => (
    <div data-key={generatedKey} className={className}>
      {text}
      {children}
    </div>
  ),
});

const buttonDef = createComponentDefinition({
  name: "Button",
  description: "Click target",
  props: z.object({ label: z.string().optional() }),
  callbacks: { onClick: z.object({}).optional() },
});

export const buttonRenderer = createComponentImplementation({
  def: buttonDef,
  render: ({ label, onClick, generatedKey }) => (
    <button
      type="button"
      data-key={generatedKey}
      onClick={() => onClick({})}
    >
      {label ?? "click"}
    </button>
  ),
});

const throwerDef = createComponentDefinition({
  name: "Thrower",
  description: "Always throws — used to exercise the error boundary",
  props: z.object({}),
});

export const throwerRenderer = createComponentImplementation({
  def: throwerDef,
  render: () => {
    throw new Error("BOOM_FROM_THROWER");
  },
});

const placeholderDef = createComponentDefinition({
  name: "Placeholder",
  description: "Test placeholder rendered while children are unstreamed",
  props: z.object({}),
});

export const placeholderRenderer = createComponentImplementation({
  def: placeholderDef,
  render: () => <span data-placeholder>placeholder</span>,
});

export const defaultImplementations: Record<string, ComponentImplementation> = {
  Box: boxRenderer,
  Button: buttonRenderer,
  Thrower: throwerRenderer,
  Placeholder: placeholderRenderer,
};

// The array form of `defaultImplementations` for `<Renderer implementations={…}>` (the prop is
// an array). A module const so the reference stays STABLE across re-renders —
// tests that rerender depend on this; an inline `Object.values(...)` would churn
// the registry and break the render-once / init-once guarantees.
export const defaultImplementationsList = Object.values(defaultImplementations);

type MountOptions = {
  rootScope?: Record<string, unknown>;
  scopes?: Record<string, Record<string, unknown>>;
  implementations?: Record<string, ComponentImplementation>;
  functions?: StandardTool[];
  components?: RendererComponents;
  /** Wrap the renderer in an additional element. */
  wrapper?: (children: ReactNode) => ReactElement;
};

/**
 * Mount a chunk tree with the standard test scaffolding (registry + root
 * scope). Returns the @testing-library/react
 * render result plus the live scopes map so tests can drive state.
 */
export function mountChunks(lines: ComponentEntry[], options: MountOptions = {}) {
  const elements = buildElementsById(lines);
  const scopes: Record<string, ReturnType<typeof createProxyScope>> = {
    root: createProxyScope(options.rootScope ?? {}),
  };
  for (const [name, seed] of Object.entries(options.scopes ?? {})) {
    scopes[name] = createProxyScope(seed);
  }

  // Find the root chunk structurally (the `op` field is gone): the root is
  // the chunk no other chunk references as a child. Fall back to the first
  // chunk, then "root".
  const childKeys = new Set(lines.flatMap((l) => l.children ?? []));
  const rootKey =
    lines.find((l) => !childKeys.has(l.key))?.key ?? lines[0]?.key ?? "root";

  const store = createElementsStore(elements);
  const inner = (
    <ElementsStoreProvider value={store}>
      <RendererRegistryProvider
        value={{
          implementations: options.implementations ?? defaultImplementations,
          components: options.components,
          functions: options.functions,
        }}
      >
        <RecursiveRenderer elementKey={rootKey} scopes={scopes} />
      </RendererRegistryProvider>
    </ElementsStoreProvider>
  );

  const wrapped = options.wrapper ? options.wrapper(inner) : inner;
  const result = render(wrapped);
  return { ...result, scopes };
}
