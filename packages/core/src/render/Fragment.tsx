import z from "zod";
import type { createReactiveProxy } from "./createReactiveProxy";
import { createAIComponentDef } from "./createAIComponentDef";
import { createAIComponentRenderer } from "./createAIComponentRenderer";

/**
 * Context passed to the consumer's `init` callback. `scopes` is the live
 * reactive Proxy tree — assignments like `scopes.root.headings = X` route
 * through the Proxy's `set` trap and emit the same change events that a
 * `defaults`-driven `$set` would, so downstream chunks observing the path
 * re-render normally.
 */
export type InitContext = {
  scopes: Record<string, ReturnType<typeof createReactiveProxy>>;
};

/**
 * Consumer-supplied side-effect callback that runs exactly once on mount,
 * before any LLM-emitted root chunks render. Sync writes land immediately
 * (via the Proxy `set` trap). Async writes Suspend the wrapper via the
 * same `setDefaultsPromiseRef` + `use(p)` flow async string-form defaults
 * already use — children mount only after the Promise resolves.
 */
export type InitFn = (ctx: InitContext) => unknown | Promise<unknown>;

// Host-only synthetic wrapper. Used by `createAIComponentRenderers`'s
// `Renderer` to wrap all LLM-emitted root chunks in a single React subtree
// whose mount runs the consumer-supplied `init` callback (see the `init`
// prop on `Renderer`). Two reasons it lives here, not in the catalog:
//
//  - `Renderer` constructs synthetic chunks with `component: "Fragment"` —
//    the renderer registry must contain a match, or the catch-all "Unknown
//    component" branch trips. Auto-merging in `createAIComponentRenderers`
//    (and the matching def in `createAIComponentDefs`) means consumers
//    don't have to register it manually.
//  - It carries `hidden: true` so the LLM never sees it in its component
//    menu — the wrapper is host infrastructure, not a UI primitive.

export const FragmentDef = createAIComponentDef({
  name: "Fragment",
  description:
    "Host-only wrapper that renders its children directly with no DOM. Not emitted by the LLM.",
  props: z.strictObject({}),
  hidden: true,
});

export const FragmentRenderer = createAIComponentRenderer({
  def: FragmentDef,
  renderer: ({ children }) => <>{children}</>,
});

/** Stable key used by `Renderer` for its synthetic Fragment chunk. */
export const RENDERER_FRAGMENT_KEY = "__renderer_fragment__";
