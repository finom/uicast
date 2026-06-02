import type { AIComponentRenderer } from "./createAIComponentRenderer";
import type { ChunkComponent, ChunkComponentElement } from "../types";
import { createProxyScope } from "../scope/createProxyScope";
import { RecursiveRenderer } from "./RecursiveRenderer";
import {
  RendererRegistryProvider,
  type DefaultPlaceholderComponent,
} from "./RendererRegistry";
import { buildElementsById } from "../utils/utils";
import { EditModeOverlay } from "../components/EditModeOverlay";
import {
  FragmentRenderer,
  RENDERER_FRAGMENT_KEY,
  type InitFn,
} from "./Fragment";
import { memo, useMemo } from "react";
import type { EvaluateFunctions } from "../eval/evaluate";

export type { InitContext, InitFn } from "./Fragment";

export const createAIComponentRenderers = (
  renderers: AIComponentRenderer[],
  options?: { defaultPlaceholder?: DefaultPlaceholderComponent },
) => {
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
      }: {
        lines: ChunkComponent[];
        editMode?: boolean;
        onEdit?: (elementId: string, editText: string) => void;
        functions?: EvaluateFunctions;
        init?: InitFn;
      }) => {
        // Stable identity per `functions` reference — RendererRegistry
        // value identity drives child re-renders, so we only want a new
        // object when the host actually swaps the functions map.
        const registryValue = useMemo(
          () => ({
            renderers: mergedRenderers,
            defaultPlaceholder: options?.defaultPlaceholder,
            functions,
          }),
          [functions],
        );
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
        const syntheticFragment: ChunkComponentElement = {
          key: RENDERER_FRAGMENT_KEY,
          component: "Fragment",
          children: rootKeys,
        };
        const elementsWithFragment = {
          ...elementsById,
          [RENDERER_FRAGMENT_KEY]: syntheticFragment,
        };

        return (
          <RendererRegistryProvider value={registryValue}>
            <EditModeOverlay enabled={editMode} onEdit={onEdit}>
              <RecursiveRenderer
                key={RENDERER_FRAGMENT_KEY}
                elementKey={RENDERER_FRAGMENT_KEY}
                elements={elementsWithFragment}
                scopes={{ root }}
                init={init}
              />
            </EditModeOverlay>
          </RendererRegistryProvider>
        );
      },
    ),
  };
};
