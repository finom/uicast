import { render } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { z } from "zod";
import type { StandardTool } from "standard-tool";
import { ConfirmModalProvider } from "@ui-fired/react";
import { createAIComponentDef } from "@ui-fired/core/render/createAIComponentDef";
import {
  type AIComponentRenderer,
  createAIComponentRenderer,
} from "@ui-fired/react";
import { createProxyScope } from "@ui-fired/core";
import { RecursiveRenderer } from "@ui-fired/react";
import { RendererRegistryProvider } from "@ui-fired/react";
import type { Fired } from "@ui-fired/core/types";
import { buildElementsById } from "@ui-fired/core/utils/utils";

// Lightweight test renderers wired the same way real catalog components are.

const boxDef = createAIComponentDef({
  name: "Box",
  description: "A plain div with optional text",
  props: z.object({
    text: z.string().optional(),
    className: z.string().optional(),
  }),
});

export const boxRenderer = createAIComponentRenderer({
  def: boxDef,
  renderer: ({ text, className, children, generatedKey }) => (
    <div data-key={generatedKey} className={className}>
      {text}
      {children}
    </div>
  ),
});

const buttonDef = createAIComponentDef({
  name: "Button",
  description: "Click target",
  props: z.object({ label: z.string().optional() }),
  callbacks: { onClick: z.object({}).optional() },
});

export const buttonRenderer = createAIComponentRenderer({
  def: buttonDef,
  renderer: ({ label, onClick, generatedKey }) => (
    <button
      type="button"
      data-key={generatedKey}
      onClick={() => onClick({})}
    >
      {label ?? "click"}
    </button>
  ),
});

const throwerDef = createAIComponentDef({
  name: "Thrower",
  description: "Always throws — used to exercise the error boundary",
  props: z.object({}),
});

export const throwerRenderer = createAIComponentRenderer({
  def: throwerDef,
  renderer: () => {
    throw new Error("BOOM_FROM_THROWER");
  },
});

const placeholderDef = createAIComponentDef({
  name: "Placeholder",
  description: "Test placeholder rendered while children are unstreamed",
  props: z.object({}),
});

export const placeholderRenderer = createAIComponentRenderer({
  def: placeholderDef,
  renderer: () => <span data-placeholder>placeholder</span>,
});

export const defaultRenderers: Record<string, AIComponentRenderer> = {
  Box: boxRenderer,
  Button: buttonRenderer,
  Thrower: throwerRenderer,
  Placeholder: placeholderRenderer,
};

type MountOptions = {
  rootScope?: Record<string, unknown>;
  scopes?: Record<string, Record<string, unknown>>;
  renderers?: Record<string, AIComponentRenderer>;
  functions?: StandardTool[];
  defaultPlaceholder?: () => ReactElement | null;
  /** Wrap the renderer in an additional element. */
  wrapper?: (children: ReactNode) => ReactElement;
};

/**
 * Mount a chunk tree with the standard test scaffolding (registry +
 * confirm-modal provider + root scope). Returns the @testing-library/react
 * render result plus the live scopes map so tests can drive state.
 */
export function mountChunks(lines: Fired.Element[], options: MountOptions = {}) {
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

  const inner = (
    <RendererRegistryProvider
      value={{
        renderers: options.renderers ?? defaultRenderers,
        defaultPlaceholder: options.defaultPlaceholder,
        functions: options.functions,
      }}
    >
      <ConfirmModalProvider>
        <RecursiveRenderer
          elementKey={rootKey}
          elements={elements}
          scopes={scopes}
        />
      </ConfirmModalProvider>
    </RendererRegistryProvider>
  );

  const wrapped = options.wrapper ? options.wrapper(inner) : inner;
  const result = render(wrapped);
  return { ...result, scopes };
}
