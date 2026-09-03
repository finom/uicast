import { act, render } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { z } from "zod";
import { Evaluator, type StandardToolV0 } from "@uicast/expr";
import {
  createComponentDefinition,
  createProxyScope,
  buildElementsByKey,
  type ComponentEntry,
  type EntryError,
  type ExpressionEvaluator,
  type ReactiveProxy,
} from "@uicast/core";
import {
  type ComponentImplementation,
  createComponentImplementation,
  type FallbackComponents,
} from "@uicast/react";
import { EntryRenderer } from "@uicast/react/render/entry-renderer";
import { RendererRegistryProvider } from "@uicast/react/store/renderer-registry";
import {
  createElementsStore,
  ElementsStoreProvider,
} from "@uicast/react/store/elements-store";

// Lightweight test implementations wired the same way real catalog components are.

export const testEvaluator = new Evaluator();

const boxDef = createComponentDefinition({
  name: "Box",
  description: "A plain div with optional text",
  props: z.object({
    text: z.union([z.string(), z.number()]).optional(),
    className: z.string().optional(),
  }),
});

export const boxRenderer = createComponentImplementation({
  def: boxDef,
  render: ({ text, className, children}, { entry }) => (
    <div data-key={entry.key} className={className}>
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
  render: ({ label, onClick}, { entry }) => (
    <button
      type="button"
      data-key={entry.key}
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

// The array form of `defaultImplementations` for `<RendererProvider implementations={…}>` (the prop is
// an array). A module const so the reference stays STABLE across re-renders —
// tests that rerender depend on this; an inline `Object.values(...)` would churn
// the registry and break the render-once / init-once guarantees.
export const defaultImplementationsList = Object.values(defaultImplementations);

type MountOptions = {
  rootScope?: Record<string, unknown>;
  scopes?: Record<string, Record<string, unknown>>;
  implementations?: Record<string, ComponentImplementation>;
  evaluator?: ExpressionEvaluator;
  // Test sugar: an interpreter over these tools.
  functions?: StandardToolV0[];
  fallbackComponents?: FallbackComponents;
  onError?: (error: EntryError) => void;
  // Wrap the renderer in an additional element.
  wrapper?: (children: ReactNode) => ReactElement;
};

// Mount an entry tree with the standard test scaffolding (registry + root scope). Returns the RTL render result plus the live scopes map.
export function mountEntries(lines: ComponentEntry[], options: MountOptions = {}) {
  const elements = buildElementsByKey(lines);
  const scopes: Record<string, ReactiveProxy> = {
    root: createProxyScope(options.rootScope ?? {}),
  };
  for (const [name, seed] of Object.entries(options.scopes ?? {})) {
    scopes[name] = createProxyScope(seed);
  }

  // Find the root entry structurally (the `op` field is gone): the root is
  // the entry no other entry references as a child. Fall back to the first
  // entry, then "root".
  const childKeys = new Set(lines.flatMap((l) => l.children ?? []));
  const rootKey =
    lines.find((l) => !childKeys.has(l.key))?.key ?? lines[0]?.key ?? "root";

  const store = createElementsStore(elements);
  const inner = (
    <ElementsStoreProvider value={store}>
      <RendererRegistryProvider
        value={{
          implementations: options.implementations ?? defaultImplementations,
          fallbackComponents: options.fallbackComponents,
          evaluator: options.evaluator ?? (options.functions ? new Evaluator({ functions: options.functions }) : testEvaluator),
          onError: options.onError,
        }}
      >
        <EntryRenderer elementKey={rootKey} scopes={scopes} />
      </RendererRegistryProvider>
    </ElementsStoreProvider>
  );

  const wrapped = options.wrapper ? options.wrapper(inner) : inner;
  const result = render(wrapped);

  // Stream more lines into the mounted tree. A re-emitted key replaces its
  // element (partial replacement), exactly like a live JSONL stream would.
  const emit = (...more: ComponentEntry[]) => {
    lines = [...lines, ...more];
    act(() => store.setMap(buildElementsByKey(lines)));
  };

  return { ...result, scopes, store, emit };
}
