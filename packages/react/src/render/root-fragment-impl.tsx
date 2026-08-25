import z from "zod";
import { createComponentDefinition } from "@uicast/core";
import { createComponentImplementation } from "../impl/create-component-implementation";

// Host-only synthetic wrapper that gives `init` a single mount point. `<EntriesRenderer>`
// emits it and merges this impl in itself, so consumers never register it;
// `hidden: true` keeps it out of the LLM's component menu.

export const RootFragmentImpl = createComponentImplementation({
  def: createComponentDefinition({
    name: "RootFragment",
    description:
      "Host-only wrapper that renders its children directly with no DOM. Not emitted by the LLM.",
    props: z.strictObject({}),
    hidden: true,
  }),
  render: ({ children }) => <>{children}</>,
});

/** Stable key used by `Renderer` for its synthetic RootFragment entry. */
export const ROOT_FRAGMENT_KEY = "__root_fragment__";
