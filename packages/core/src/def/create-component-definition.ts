import type { CombinedSpec, ComponentDefinition } from "../types";

/** A component that takes no props at all — the schema `props` defaults to. */
type EmptyProps = Record<string, never>;

const EMPTY_OBJECT_SCHEMA = {
  type: "object",
  properties: {},
  additionalProperties: false,
} as const;

/**
 * The props schema of a component that declares none. Hand-written rather than
 * built with a schema library, since core stays library-agnostic. It accepts
 * anything: a propless component has no shape to be wrong about, so it never
 * blames the document on the error path.
 */
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

/**
 * `children` is the entry's own field — the array of child keys the renderer
 * turns into nested elements — so a component may not also declare it as a
 * prop. One name would then carry two different things, and whichever the
 * renderer injects last would silently win. Name the prop for what it holds
 * (`text`, `label`, `title`); nested content arrives as children on its own.
 */
const RESERVED_PROP = "children";

/** Top-level property names of a spec's JSON Schema; `[]` if it isn't an object schema. */
const propertyNames = (spec: CombinedSpec): string[] => {
  let jsonSchema: unknown;
  try {
    jsonSchema = spec["~standard"].jsonSchema.input({ target: "draft-2020-12" });
  } catch {
    // A spec that cannot convert fails loudly in the prompt builder instead.
    return [];
  }
  const properties = (jsonSchema as { properties?: Record<string, unknown> } | null)
    ?.properties;
  return properties ? Object.keys(properties) : [];
};

/**
 * Value-side constructor for a {@link ComponentDefinition} (the type lives in
 * `types.ts`). Infers the concrete `props` / `callbacks` specs at the call site
 * and returns the def unchanged — its purpose is the inference + a single typed
 * authoring shape; `createComponentImplementation` later reads those inferred
 * types off the returned def. `props` may be omitted by a component that takes
 * none. It rejects a `children` prop or callback field, which would collide
 * with the entry field of the same name.
 */
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
