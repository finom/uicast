import type { AIComponentRenderer } from "./createAIComponentRenderer";
import type { Fired } from "@ui-fired/core/types";
import { createProxyScope } from "@ui-fired/core/scope/createProxyScope";
import { RecursiveRenderer } from "./RecursiveRenderer";
import {
  RendererRegistryProvider,
  type RendererComponents,
} from "./RendererRegistry";
import { buildElementsById } from "@ui-fired/core/utils/utils";
import { EditModeOverlay } from "../components/EditModeOverlay";
import {
  FragmentRenderer,
  RENDERER_FRAGMENT_KEY,
  type InitFn,
} from "./Fragment";
import { memo, useLayoutEffect, useMemo, useRef } from "react";
import type { StandardTool } from "standard-tool";
import { createElementsStore, ElementsStoreProvider } from "./ElementsStore";

export type { InitContext, InitFn } from "./Fragment";

export const createAIComponentRenderers = (renderers: AIComponentRenderer[]) => {
  const root = createProxyScope({});

  // Validate uniqueness — the array form loses the keyed-object's free
  // duplicate protection, so fail fast at import time on a repeated name.
  const seen = new Set<string>();
  for (const renderer of renderers) {
    if (seen.has(renderer.name)) {
      throw new Error(`Duplicate component name: "${renderer.name}"`);
    }
    seen.add(renderer.name);
  }

  // Build the name-keyed registry the render-time lookup expects
  // (`renderers[element.component]` in RecursiveRenderer). Each renderer
  // carries its def's `name` (spread in createAIComponentRenderer), so the
  // key === the former registry key for every component.
  //
  // Auto-merge the host-only Fragment renderer. `Renderer` always wraps
  // root chunks in a synthetic `{ component: "Fragment" }` chunk so the
  // `init` prop can hook into the existing async-defaults Suspense path;
  // the registry must contain a matching renderer or that lookup falls
  // through to the "Unknown component" branch in `RecursiveRenderer`.
  // Consumer-supplied `Fragment` is intentionally overridden — this
  // wrapper is host infrastructure, not a customization point.
  const mergedRenderers: Record<string, AIComponentRenderer> = {
    ...Object.fromEntries(renderers.map((r) => [r.name, r])),
    Fragment: FragmentRenderer,
  };

  return {
    renderers: mergedRenderers,
    Renderer: memo(
      ({
        lines,
        editMode = false,
        onEdit,
        // Host runtime functions (e.g. google-tools) exposed as bare
        // identifiers in every evaluate() call inside this tree. Passing
        // `undefined` means expressions can only reference built-ins +
        // scopes; callbacks referencing host functions will throw at eval
        // time with a "<name> is not defined" message that points at the
        // missing wiring.
        functions,
        // One-shot side-effect callback that runs on the synthetic
        // Fragment wrapper's mount, before any LLM-emitted root chunk
        // evaluates its props/defaults. Writes to `scopes.*` via the
        // reactive Proxy (`scopes.root.headings = X`) propagate to
        // subscribers as normal. If `init` returns a Promise, the
        // wrapper Suspends until it resolves, so children see the
        // seeded state by the time they mount.
        init,
        // Host-supplied visual components for the engine's own chrome
        // (currently `placeholder`, shown while a node's chunk hasn't streamed
        // in). Write inline — `<Renderer components={{ placeholder: MyPlaceholder }} />`
        // — but pass a STABLE reference (module const or memoized), exactly like
        // `functions`: it feeds the registry context value, whose identity must
        // stay stable or every node re-renders.
        components,
      }: {
        lines: Fired.Element[];
        editMode?: boolean;
        onEdit?: (elementId: string, editText: string) => void;
        functions?: StandardTool[];
        init?: InitFn;
        components?: RendererComponents;
      }) => {
        // Stable identity per `functions` reference — RendererRegistry
        // value identity drives child re-renders, so we only want a new
        // object when the host actually swaps the functions map.
        const registryValue = useMemo(
          () => ({
            renderers: mergedRenderers,
            components,
            functions,
          }),
          [functions, components],
        );
        // Stable scopes object — passed unchanged to every node so memoized
        // children can bail. `root` is created once per renderer factory.
        const scopes = useMemo(() => ({ root }), []);
        const elementsById = buildElementsById(lines);

        // Root chunks are derived structurally (there is no `op` field): a
        // chunk is a root iff no other chunk references its `key` in a
        // `children` array. Collect every referenced child key first, then
        // keep the chunks nothing points at. Walk in emission order and dedup
        // by key (same first-occurrence semantics as the old `uniqBy`).
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

        // Always wrap roots in a synthetic Fragment chunk — even when
        // `init` is undefined — so tree topology stays consistent. The
        // Fragment becomes the single top-level mount; the original
        // roots become its children. Visually identical (Fragment
        // renders children directly via React.Fragment), but it gives
        // `init` exactly one mount point to attach to.
        const syntheticFragment: Fired.Element = {
          key: RENDERER_FRAGMENT_KEY,
          component: "Fragment",
          children: rootKeys,
        };
        const elementsWithFragment = {
          ...elementsById,
          [RENDERER_FRAGMENT_KEY]: syntheticFragment,
        };

        // Structural store lives across renders; the per-node `useElement`
        // subscriptions read from it. We refresh it AFTER commit (layout
        // effect) so swapping the map notifies only the keys that changed —
        // settled nodes never re-render while later chunks stream in.
        const storeRef = useRef<ReturnType<typeof createElementsStore> | null>(
          null,
        );
        if (!storeRef.current) {
          storeRef.current = createElementsStore(elementsWithFragment);
        }
        useLayoutEffect(() => {
          storeRef.current?.setMap(elementsWithFragment);
        });

        return (
          <ElementsStoreProvider value={storeRef.current}>
            <RendererRegistryProvider value={registryValue}>
              <EditModeOverlay enabled={editMode} onEdit={onEdit}>
                <RecursiveRenderer
                  key={RENDERER_FRAGMENT_KEY}
                  elementKey={RENDERER_FRAGMENT_KEY}
                  scopes={scopes}
                  init={init}
                />
              </EditModeOverlay>
            </RendererRegistryProvider>
          </ElementsStoreProvider>
        );
      },
    ),
  };
};
