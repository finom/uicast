import { createComponentDefinition } from "@uicast/core";
import { createComponentImplementation } from "../impl/create-component-implementation";

// One mount point for `init`. RendererProvider registers it; `hidden` keeps it out of the prompt.

export const RootFragmentImpl = createComponentImplementation({
  def: createComponentDefinition({
    name: "RootFragment",
    description:
      "Host-only wrapper that renders its children directly with no DOM. Not emitted by the LLM.",
    hidden: true,
  }),
  render: ({ children }) => <>{children}</>,
});

export const ROOT_FRAGMENT_KEY = "__root_fragment__";
