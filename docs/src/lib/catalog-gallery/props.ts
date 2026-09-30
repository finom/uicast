import type { ComponentDefinition, ComponentEntry, ValueSource } from "@uicast/core";
import { type Expression, parseExpressionAt, type SpreadElement } from "acorn";

type Schema = {
  type?: string | string[];
  enum?: unknown[];
  anyOf?: Schema[];
  const?: unknown;
  $ref?: string;
  default?: unknown;
  description?: string;
  minimum?: number;
  maximum?: number;
  properties?: Record<string, Schema>;
  required?: string[];
  $defs?: Record<string, Schema>;
};

export type Control =
  | { kind: "enum"; options: string[] }
  // Named values or a JSON value of another shape, as a date format that is a name or Intl options.
  | { kind: "enum-or-json"; options: string[] }
  | { kind: "boolean" }
  | { kind: "number"; min?: number; max?: number }
  | { kind: "string" }
  | { kind: "json" };

export type Field = { name: string; control: Control; required: boolean; default?: unknown; description?: string };

const schemaOf = (spec: ComponentDefinition["props"]) =>
  spec["~standard"].jsonSchema.input({ target: "draft-2020-12" }) as Schema;

// A control per prop, from the def's JSON Schema.
export function fieldsOf(def: ComponentDefinition): Field[] {
  const root = schemaOf(def.props);
  const resolve = (node: Schema): Schema =>
    node.$ref ? { ...root.$defs?.[node.$ref.replace("#/$defs/", "")], ...node, $ref: undefined } : node;
  const controlOf = (node: Schema): Control => {
    if (node.enum?.every((value) => typeof value === "string")) return { kind: "enum", options: node.enum as string[] };
    if (node.anyOf) {
      const options = node.anyOf.map(resolve);
      if (options.every((option) => typeof option.const === "string")) {
        return { kind: "enum", options: options.map((option) => option.const as string) };
      }
      const nonNull = options.filter((option) => option.type !== "null");
      if (nonNull.length === 1) return controlOf(nonNull[0]);
      const named = nonNull.find((option) => option.enum?.every((value) => typeof value === "string"));
      return named ? { kind: "enum-or-json", options: named.enum as string[] } : { kind: "json" };
    }
    const types = ([] as string[]).concat(node.type ?? []).filter((type) => type !== "null");
    if (types.length === 1 && types[0] === "boolean") return { kind: "boolean" };
    if (types.length > 0 && types.every((type) => type === "number" || type === "integer")) {
      return { kind: "number", min: node.minimum, max: node.maximum };
    }
    if (types.includes("string") && types.every((type) => type === "string" || type === "number")) {
      return { kind: "string" };
    }
    return { kind: "json" };
  };
  return Object.entries(root.properties ?? {}).map(([name, node]) => {
    const field = resolve(node);
    return {
      name,
      control: controlOf(field),
      required: root.required?.includes(name) ?? false,
      default: field.default,
      description: field.description,
    };
  });
}

export const callbacksOf = (def: ComponentDefinition) =>
  Object.entries(def.callbacks ?? {}).map(([name, spec]) => ({ name, description: schemaOf(spec).description }));

// The entry's props, split into JSON values the controls edit and bound fields kept as written.
export type Props =
  | { values: Record<string, unknown>; bound: Record<string, string>; order: string[] }
  | { opaque: string };

const NOT_JSON = Symbol();

function jsonOf(node: Expression | SpreadElement | null): unknown {
  switch (node?.type) {
    case "Literal":
      return "regex" in node || "bigint" in node ? NOT_JSON : node.value;
    case "TemplateLiteral":
      return node.expressions.length ? NOT_JSON : node.quasis[0].value.cooked;
    case "UnaryExpression":
      return node.operator === "-" && node.argument.type === "Literal" && typeof node.argument.value === "number"
        ? -node.argument.value
        : NOT_JSON;
    case "ArrayExpression": {
      const items = node.elements.map(jsonOf);
      return items.includes(NOT_JSON) ? NOT_JSON : items;
    }
    case "ObjectExpression": {
      const entries = node.properties.map((prop) =>
        prop.type === "Property" && !prop.computed && prop.key.type === "Identifier"
          ? [prop.key.name, jsonOf(prop.value as Expression)]
          : [null, NOT_JSON],
      );
      return entries.some(([, value]) => value === NOT_JSON) ? NOT_JSON : Object.fromEntries(entries);
    }
    default:
      return NOT_JSON;
  }
}

export function readProps(entry: ComponentEntry): Props {
  const props = entry.props;
  if (!props) return { values: {}, bound: {}, order: [] };
  if ("literal" in props) {
    const values = { ...(props.literal as Record<string, unknown>) };
    return { values, bound: {}, order: Object.keys(values) };
  }
  let node: Expression;
  try {
    node = parseExpressionAt(props.expr, 0, { ecmaVersion: "latest" });
  } catch {
    return { opaque: props.expr };
  }
  if (node.type !== "ObjectExpression") return { opaque: props.expr };
  const out = { values: {} as Record<string, unknown>, bound: {} as Record<string, string>, order: [] as string[] };
  for (const prop of node.properties) {
    if (prop.type !== "Property" || prop.computed || prop.key.type !== "Identifier") return { opaque: props.expr };
    const name = prop.key.name;
    const value = jsonOf(prop.value as Expression);
    out.order.push(name);
    if (value === NOT_JSON) out.bound[name] = props.expr.slice(prop.value.start, prop.value.end);
    else out.values[name] = value;
  }
  return out;
}

// A JSON value as expression source, quoted with single quotes so it reads cleanly inside a JSON line.
const js = (value: unknown): string => {
  if (typeof value === "string") return `'${value.replace(/[\\']/g, "\\$&").replace(/\n/g, "\\n")}'`;
  if (Array.isArray(value)) return `[${value.map(js).join(", ")}]`;
  if (value && typeof value === "object") {
    const fields = Object.entries(value).map(
      ([key, item]) => `${/^[A-Za-z_$][\w$]*$/.test(key) ? key : js(key)}: ${js(item)}`,
    );
    return fields.length ? `{ ${fields.join(", ")} }` : "{}";
  }
  return String(value);
};

export function writeProps(props: Props): ValueSource {
  if ("opaque" in props) return { expr: props.opaque };
  const { values, bound, order } = props;
  const names = [...order, ...Object.keys(values).filter((name) => !order.includes(name))].filter(
    (name) => name in values || name in bound,
  );
  if (!Object.keys(bound).length) return { literal: Object.fromEntries(names.map((name) => [name, values[name]])) };
  return { expr: `({ ${names.map((name) => `${name}: ${bound[name] ?? js(values[name])}`).join(", ")} })` };
}
