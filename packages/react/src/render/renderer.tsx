"use client";
import { memo, useLayoutEffect, useMemo, useRef } from "react";
import { createProxyScope } from "@ui-fired/core/scope/create-proxy-scope";
import type { ComponentEntry } from "@ui-fired/core/types";
import { buildElementsById } from "@ui-fired/core/utils/utils";
import type { StandardTool } from "standard-tool";
import { ConfirmHost } from "../components/confirm";
import type { ComponentImplementation } from "./create-component-implementation";
import { createElementsStore, ElementsStoreProvider } from "./elements-store";
import {
  FragmentRenderer,
  type InitFn,
  RENDERER_FRAGMENT_KEY,
} from "./fragment";
import { RecursiveRenderer } from "./recursive-renderer";
import {
  type RendererComponents,
  RendererRegistryProvider,
} from "./renderer-registry";

export type RendererProps = {
  /**
   * The component implementations: an array of `ComponentImplementation`.
   * `<Renderer>` builds the name→implementation lookup itself
   * (`element.component` is matched to `implementation.name`) — symmetric with
   * `functions`. Pass a STABLE reference (a module const, not a fresh array each
   * render) because it feeds the registry context, whose identity must stay
   * stable or every node re-renders. On a duplicate name the later
   * implementation wins (so `[...base, Override]` overrides) and a
   * `console.error` is logged.
   */
  implementations: ComponentImplementation[];
  lines: ComponentEntry[];
  /**
   * Host runtime functions exposed as bare identifiers in every evaluate() call
   * inside this tree (callbacks invoke them as `name(input)`). Pass a stable
   * reference, like `implementations`. `undefined` means expressions can only reference
   * built-ins + scopes.
   */
  functions?: StandardTool[];
  /**
   * One-shot side-effect run on the synthetic Fragment wrapper's mount, before
   * any LLM-emitted root chunk evaluates its props/defaults. May seed
   * `scopes.root.*` via the reactive Proxy; if it returns a Promise the wrapper
   * Suspends until it resolves so children see the seeded state on mount.
   */
  init?: InitFn;
  /**
   * Host-supplied visual components for the engine's own chrome: `placeholder`
   * (shown while a node's chunk hasn't streamed in) and `confirm` (the modal
   * resolving callback steps that carry `confirm:`; defaults to
   * `window.confirm`). Distinct from `implementations` (the AI-renderable components).
   * Pass a stable reference, like `functions`.
   */
  components?: RendererComponents;
};

/**
 * Renders a JSONLines chunk tree from a host-supplied `implementations` array
 * (the component implementations). Each mounted Renderer owns an isolated
 * reactive `root` scope.
 */
export const Renderer = memo(function Renderer({
  implementations,
  lines,
  functions,
  init,
  components,
}: RendererProps) {
  // Per-instance root scope — isolated reactive state per mounted Renderer.
  // (Lazy-init via ref, like the structural store below.)
  const rootRef = useRef<ReturnType<typeof createProxyScope> | null>(null);
  if (!rootRef.current) rootRef.current = createProxyScope({});
  const scopes = useMemo(() => ({ root: rootRef.current! }), []);

  // Build the name→implementation lookup the registry needs from the
  // `implementations` array (the shape `element.component` is matched against).
  // Last entry wins on a duplicate name — so `[...base, Override]` overrides —
  // and we log it. The host Fragment renderer is always merged in last (host
  // infrastructure; overrides any consumer-supplied one). Memoised so identity
  // tracks `implementations`.
  const implementationsByName = useMemo(() => {
    const map: Record<string, ComponentImplementation> = {};
    for (const impl of implementations) {
      if (impl.name in map) {
        console.error(
          `[ui-fired] Duplicate component name "${impl.name}" in implementations — the later one wins.`,
        );
      }
      map[impl.name] = impl;
    }
    map.Fragment = FragmentRenderer;
    return map;
  }, [implementations]);

  // Stable registry value — its identity drives child re-renders, so we only
  // want a new object when the host actually swaps implementations/functions/components.
  const registryValue = useMemo(
    () => ({ implementations: implementationsByName, components, functions }),
    [implementationsByName, components, functions],
  );

  const elementsById = buildElementsById(lines);

  // Root chunks are derived structurally (there is no `op` field): a chunk is a
  // root iff no other chunk references its `key` in a `children` array. Collect
  // every referenced child key first, then keep the chunks nothing points at.
  // Walk in emission order and dedup by key.
  const childKeys = new Set<string>();
  for (const line of lines) {
    for (const childKey of line.children ?? []) childKeys.add(childKey);
  }
  const seenRootKeys = new Set<string>();
  const rootKeys: string[] = [];
  for (const line of lines) {
    if (childKeys.has(line.key) || seenRootKeys.has(line.key)) continue;
    seenRootKeys.add(line.key);
    rootKeys.push(line.key);
  }

  // Always wrap roots in a synthetic Fragment chunk — even when `init` is
  // undefined — so tree topology stays consistent and `init` has exactly one
  // mount point to attach to. Visually identical (Fragment renders children
  // directly via React.Fragment).
  const syntheticFragment: ComponentEntry = {
    key: RENDERER_FRAGMENT_KEY,
    component: "Fragment",
    children: rootKeys,
  };
  const elementsWithFragment = {
    ...elementsById,
    [RENDERER_FRAGMENT_KEY]: syntheticFragment,
  };

  // Structural store lives across renders; the per-node `useElement`
  // subscriptions read from it. We refresh it AFTER commit (layout effect) so
  // swapping the map notifies only the keys that changed — settled nodes never
  // re-render while later chunks stream in.
  const storeRef = useRef<ReturnType<typeof createElementsStore> | null>(null);
  if (!storeRef.current) {
    storeRef.current = createElementsStore(elementsWithFragment);
  }
  useLayoutEffect(() => {
    storeRef.current?.setMap(elementsWithFragment);
  });

  return (
    <ElementsStoreProvider value={storeRef.current}>
      <RendererRegistryProvider value={registryValue}>
        <ConfirmHost confirm={components?.confirm}>
          <RecursiveRenderer
            key={RENDERER_FRAGMENT_KEY}
            elementKey={RENDERER_FRAGMENT_KEY}
            scopes={scopes}
            init={init}
          />
        </ConfirmHost>
      </RendererRegistryProvider>
    </ElementsStoreProvider>
  );
});
