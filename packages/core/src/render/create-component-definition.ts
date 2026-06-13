import type { CombinedSpec } from "../types";

export const createComponentDefinition = <
  TProps extends CombinedSpec,
  TCallbacks extends Record<string, CombinedSpec> = Record<string, never>,
>({
  name,
  description,
  props,
  callbacks,
  hidden,
}: {
  name: string;
  description: string;
  props: TProps;
  callbacks?: TCallbacks;
  /**
   * Host-only component. Registered in the renderer registry so chunks
   * referencing it mount correctly, but filtered out of the LLM-facing
   * prompt list in `getComponentsPartialPrompt`. Use for internal infrastructure
   * (e.g. Fragment — the synthetic wrapper used by `Renderer`'s `init`
   * prop machinery) that the LLM should never emit.
   */
  hidden?: boolean;
}) => {
  return { name, description, props, callbacks, hidden };
};

export type ComponentDefinition = ReturnType<typeof createComponentDefinition>;
