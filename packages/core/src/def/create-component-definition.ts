import { specToJSONSchema } from "../prompt-utils/spec-to-json-schema";
import type { CombinedSpec, ComponentDefinition } from "../types";

/** A component that takes no props at all — the schema `props` defaults to. */
type EmptyProps = Record<string, never>;

const EMPTY_OBJECT_SCHEMA = {
  type: "object",
  properties: {},
  additionalProperties: false,
} as const;

/** Props schema of a propless component — accepts anything, hand-written so core stays schema-library-agnostic. */
export const NO_PROPS: CombinedSpec<EmptyProps, EmptyProps> = {
  "~standard": {
    version: 1,
    vendor: "uicast",
    validate: (value) => ({ value: value as EmptyProps }),
    jsonSchema: {
      input: () => ({ ...EMPTY_OBJECT_SCHEMA }),
      output: () => ({ ...EMPTY_OBJECT_SCHEMA }),
    },
  },
};

/** `children` is the entry's own field, so a def may not also declare it as a prop. */
const RESERVED_PROP = "children";

/** Top-level property names of a spec's JSON Schema; `[]` if it isn't an object schema. */
const propertyNames = (spec: CombinedSpec): string[] => {
  try {
    const { properties } = specToJSONSchema(spec);
    return properties ? Object.keys(properties) : [];
  } catch {
    // A spec that cannot convert fails loudly in the prompt builder instead.
    return [];
  }
};

/** Value-side constructor for a {@link ComponentDefinition}; infers the concrete `props`/`callbacks` spec types at the call site. Rejects a `children` prop or callback. */
export const createComponentDefinition = <
  TProps extends CombinedSpec = typeof NO_PROPS,
  TCallbacks extends Record<string, CombinedSpec> = Record<string, never>,
>({
  name,
  description,
  props = NO_PROPS as unknown as TProps,
  callbacks,
  hidden,
}: Omit<ComponentDefinition<TProps, TCallbacks>, "props"> & {
  /** Omit for a component that takes no props — a wrapper, a divider. */
  props?: TProps;
}): ComponentDefinition<TProps, TCallbacks> => {
  if (propertyNames(props).includes(RESERVED_PROP)) {
    throw new Error(
      `Component "${name}": "children" is a reserved name and cannot be a prop. Name the prop for what it holds (e.g. "text"); nested elements come from the entry's \`children\` array.`,
    );
  }
  for (const [event, payload] of Object.entries(callbacks ?? {})) {
    if (propertyNames(payload as CombinedSpec).includes(RESERVED_PROP)) {
      throw new Error(
        `Component "${name}": callback "${event}" declares a "children" field, which is a reserved name. Rename it.`,
      );
    }
  }
  return { name, description, props, callbacks, hidden };
};
