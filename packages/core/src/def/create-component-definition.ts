import { isSchemaObject, type JSONSchema, resolveRef } from "../prompt-utils/json-schema-to-ts";
import { specToJSONSchema } from "../prompt-utils/spec-to-json-schema";
import type { CombinedSpec, ComponentDefinition } from "../types";

type EmptyProps = Record<string, never>;

const EMPTY_OBJECT_SCHEMA = {
  type: "object",
  properties: {},
  additionalProperties: false,
} as const;

// Hand-written, so core needs no schema library.
const NO_PROPS: CombinedSpec<EmptyProps, EmptyProps> = {
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

const RESERVED_PROP = "children";

// The top-level field names: the root object's, each union or intersection branch's, and a root `$ref`'s.
const propertyNames = (spec: CombinedSpec): string[] => {
  let schema: JSONSchema;
  try {
    schema = specToJSONSchema(spec);
  } catch {
    // A spec that cannot convert fails loudly in the prompt builder instead.
    return [];
  }
  const names = new Set<string>();
  const seen = new Set<JSONSchema>();
  const stack: unknown[] = [schema];
  while (stack.length > 0) {
    const node = stack.pop();
    if (!isSchemaObject(node) || seen.has(node)) continue;
    seen.add(node);
    for (const name of Object.keys(node.properties ?? {})) names.add(name);
    if (typeof node.$ref === "string") stack.push(resolveRef(node.$ref, schema));
    stack.push(...(node.anyOf ?? []), ...(node.oneOf ?? []), ...(node.allOf ?? []));
  }
  return [...names];
};

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
  props?: TProps;
}): ComponentDefinition<TProps, TCallbacks> => {
  if (propertyNames(props).includes(RESERVED_PROP)) {
    throw new Error(
      `Component "${name}": "children" is a reserved name and cannot be a prop. Name the prop for what it holds (e.g. "text"); nested elements come from the entry's \`children\` array.`,
    );
  }
  for (const [event, payload] of Object.entries(callbacks ?? {})) {
    if (propertyNames(payload).includes(RESERVED_PROP)) {
      throw new Error(
        `Component "${name}": callback "${event}" declares a "children" field, which is a reserved name. Rename it.`,
      );
    }
  }
  return { name, description, props, callbacks, hidden };
};
