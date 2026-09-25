import { type JSONSchema, resolvePointer } from "../json-schema";

type Multiline = { pad: string; depth: number } | null;

type Ctx = {
  root: unknown;
  seen: Set<string>;
  named: Record<string, string> | null;
};

type JSONSchemaToTsOptions = {
  // The caller's continuation indent; omit for the single-line form.
  multiline?: string;
  // `{ "#/$defs/Person": "Person" }`: what makes a recursive schema expressible.
  namedRefs?: Record<string, string>;
};

// Pass the whole document so `$ref`s resolve; a cycle renders `unknown` unless the ref is in `namedRefs`.
export const jsonSchemaToTs = (jsonSchema: unknown, options: JSONSchemaToTsOptions = {}): string =>
  toTs(
    jsonSchema,
    { root: jsonSchema, seen: new Set(), named: options.namedRefs ?? null },
    options.multiline === undefined ? null : { pad: options.multiline, depth: 0 },
  );

const toTs = (jsonSchema: unknown, ctx: Ctx, ml: Multiline = null): string => {
  const base = toTsBase(jsonSchema, ctx, ml);
  const note = annotation(jsonSchema);
  return note ? `${base} /* ${note} */` : base;
};

// One line; a `*/` inside would end the comment early, so it is neutered.
const annotation = (jsonSchema: unknown): string => {
  if (jsonSchema === null || typeof jsonSchema !== "object") return "";
  const schema = jsonSchema as JSONSchema;
  const description = typeof schema.description === "string" ? schema.description.replace(/\s+/g, " ").trim() : "";
  return [description, constraints(schema).join(", ")].filter(Boolean).join(" ").replace(/\*\//g, "*");
};

// A bare `.int()` stamps ±MAX_SAFE_INTEGER, which is no constraint.
const constraints = (schema: JSONSchema): string[] => {
  const out: string[] = [];
  const types = Array.isArray(schema.type) ? schema.type : [schema.type];
  if (types.includes("integer")) out.push("integer");
  if (schema.minimum !== undefined && schema.minimum !== -Number.MAX_SAFE_INTEGER) out.push(`≥ ${schema.minimum}`);
  if (schema.maximum !== undefined && schema.maximum !== Number.MAX_SAFE_INTEGER) out.push(`≤ ${schema.maximum}`);
  if (schema.exclusiveMinimum !== undefined) out.push(`> ${schema.exclusiveMinimum}`);
  if (schema.exclusiveMaximum !== undefined) out.push(`< ${schema.exclusiveMaximum}`);
  if (schema.multipleOf !== undefined) out.push(`multiple of ${schema.multipleOf}`);
  if (schema.minLength !== undefined) out.push(`length ≥ ${schema.minLength}`);
  if (schema.maxLength !== undefined) out.push(`length ≤ ${schema.maxLength}`);
  // A format comes with a generated pattern; the name says it better.
  if (schema.format) out.push(`format ${schema.format}`);
  else if (schema.pattern) out.push(`pattern ${schema.pattern}`);
  if (schema.minItems !== undefined) out.push(`items ≥ ${schema.minItems}`);
  if (schema.maxItems !== undefined) out.push(`items ≤ ${schema.maxItems}`);
  if (schema.uniqueItems) out.push("unique items");
  if (schema.default !== undefined) out.push(`default ${JSON.stringify(schema.default)}`);
  return out;
};

// `(A | B)` from the branches, or `empty` when there are none.
const union = (parts: string[], separator: string, empty: string): string =>
  parts.length ? `(${parts.join(separator)})` : empty;

const toTsBase = (jsonSchema: unknown, ctx: Ctx, ml: Multiline): string => {
  if (jsonSchema === true) return "unknown";
  if (jsonSchema === false) return "never";
  if (jsonSchema === null || typeof jsonSchema !== "object") return "unknown";
  const schema = jsonSchema as JSONSchema;

  if (typeof schema.$ref === "string") {
    // Before the cycle guard: a recursive type is exactly the case a name is for.
    const named = ctx.named?.[schema.$ref];
    if (named) return named;
    if (ctx.seen.has(schema.$ref)) return "unknown";
    const target = resolvePointer(schema.$ref, ctx.root);
    if (target === undefined) return "unknown";
    ctx.seen.add(schema.$ref);
    // The referencing node's own annotation wins, so the target renders without its root annotation.
    const resolved = annotation(schema) ? toTsBase(target, ctx, ml) : toTs(target, ctx, ml);
    ctx.seen.delete(schema.$ref);
    return resolved;
  }

  if ("const" in schema) return JSON.stringify(schema.const);
  if (schema.enum) return schema.enum.map((v) => JSON.stringify(v)).join(" | ") || "never";
  if (schema.allOf)
    return union(
      schema.allOf.map((s) => toTs(s, ctx, ml)),
      " & ",
      "unknown",
    );
  if (schema.anyOf)
    return union(
      schema.anyOf.map((s) => toTs(s, ctx, ml)),
      " | ",
      "never",
    );
  if (schema.oneOf)
    return union(
      schema.oneOf.map((s) => toTs(s, ctx, ml)),
      " | ",
      "never",
    );
  if (schema.not) return "unknown";
  // The wrapper annotates the union as a whole.
  if (Array.isArray(schema.type)) {
    return union(
      schema.type.map((t) => toTsBase({ ...schema, type: t }, ctx, ml)),
      " | ",
      "unknown",
    );
  }

  const { type } = schema;
  if (type === "string") return "string";
  if (type === "number" || type === "integer") return "number";
  if (type === "boolean") return "boolean";
  if (type === "null") return "null";
  if (type === "object" || schema.properties || schema.additionalProperties !== undefined)
    return renderObject(schema, ctx, ml);
  if (type === "array" || schema.items || schema.prefixItems) return renderArray(schema, ctx, ml);
  return "unknown";
};

const renderObject = (schema: JSONSchema, ctx: Ctx, ml: Multiline): string => {
  const required = schema.required ?? [];
  const childMl = ml ? { pad: ml.pad, depth: ml.depth + 1 } : null;
  const fields = Object.entries(schema.properties ?? {}).map(([key, value]) => {
    const name = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : JSON.stringify(key);
    return `${name}${required.includes(key) ? "" : "?"}: ${toTs(value, ctx, childMl)}`;
  });

  const extra = schema.additionalProperties;
  // Single-line even in multiline mode: it sits inside an index-signature wrapper.
  const extraType = extra === true ? "unknown" : extra && typeof extra === "object" ? toTs(extra, ctx) : null;

  if (fields.length === 0) {
    if (extraType) return `{ [key: string]: ${extraType} }`;
    return extra === false ? "{}" : "{ [key: string]: unknown }";
  }
  let result = `{ ${fields.join("; ")} }`;
  if (ml) {
    const inner = ml.pad + "  ".repeat(ml.depth + 1);
    result = `{\n${inner}${fields.join(`;\n${inner}`)};\n${ml.pad}${"  ".repeat(ml.depth)}}`;
  }
  return extraType ? `(${result} & { [key: string]: ${extraType} })` : result;
};

const renderArray = (schema: JSONSchema, ctx: Ctx, ml: Multiline): string => {
  // Single-line even in multiline mode: a tuple reads as one row.
  if (schema.prefixItems) {
    const tuple = schema.prefixItems.map((s) => toTs(s, ctx)).join(", ");
    if (schema.items === false) return `[${tuple}]`;
    return `[${tuple}, ...${schema.items ? toTs(schema.items, ctx) : "unknown"}[]]`;
  }
  if (schema.items === undefined) return "unknown[]";
  const itemTs = toTs(schema.items, ctx, ml);
  // `string /* x */[]` reads as if the comment interrupts the type; parenthesized it does not.
  return itemTs.endsWith("*/") ? `(${itemTs})[]` : `${itemTs}[]`;
};
