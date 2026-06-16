import z from "zod";
import { createComponentDefinition } from "@ui-fired/core";
import { createComponentImplementation } from "../impl/create-component-implementation";

// Host-only synthetic wrapper. `<Renderer>` wraps all LLM-emitted root chunks
// in one of these so the consumer's `init` callback has a single mount point
// (see the `init` prop on `Renderer`). It lives here, not in the catalog:
//
//  - `<Renderer>` emits synthetic chunks with `component: "RootFragment"` and
//    merges this impl into the implementations map itself, so a match always
//    exists and consumers never register it.
//  - `hidden: true` keeps it out of the LLM's component menu — host
//    infrastructure, not a UI primitive (so it never joins a prompt def registry).

export const RootFragmentRenderer = createComponentImplementation({
  def: createComponentDefinition({
    name: "RootFragment",
    description:
      "Host-only wrapper that renders its children directly with no DOM. Not emitted by the LLM.",
    props: z.strictObject({}),
    hidden: true,
  }),
  render: ({ children }) => <>{children}</>,
});

/** Stable key used by `Renderer` for its synthetic RootFragment chunk. */
export const ROOT_FRAGMENT_KEY = "__root_fragment__";
