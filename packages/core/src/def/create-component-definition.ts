import type { CombinedSpec, ComponentDefinition } from "../types";

/**
 * Value-side constructor for a {@link ComponentDefinition} (the type lives in
 * `types.ts`). Infers the concrete `props` / `callbacks` specs at the call site
 * and returns the def unchanged — its purpose is the inference + a single typed
 * authoring shape; `createComponentImplementation` later reads those inferred
 * types off the returned def.
 */
export const createComponentDefinition = <
  TProps extends CombinedSpec,
  TCallbacks extends Record<string, CombinedSpec> = Record<string, never>,
>({
  name,
  description,
  props,
  callbacks,
  hidden,
}: ComponentDefinition<TProps, TCallbacks>): ComponentDefinition<TProps, TCallbacks> => {
  return { name, description, props, callbacks, hidden };
};
