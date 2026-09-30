import { isSchemaObject, type JSONSchema, resolvePointer, specToJSONSchema } from "../json-schema";
import type { ComponentDefinition } from "../types";
import { resolveUrlPolicy, schemaHasUrlFormat, type UrlPolicy } from "../url-policy";
import { dashTail, joinSections, noteSection, stripRootAnnotations, unwrapParens } from "./format";
import { jsonSchemaToTs } from "./json-schema-to-ts";
import { collectSharedTypes } from "./shared-types";

/**
 * Options for `getComponentsPartialPrompt`.
 *
 * @example
 * const options: ComponentsPromptOptions = { definitions: defs, urlPolicy };
 */
export type ComponentsPromptOptions = {
  /** Your definitions: the same components the renderer has. One with `hidden: true` is left out. */
  definitions: ComponentDefinition[];
  /** The renderer's `urlPolicy`, so the model writes URLs the renderer loads. Omitted: the renderer's defaults. */
  urlPolicy?: UrlPolicy;
  /** Your text, appended verbatim as this section's trailing `## Note`. */
  note?: string;
};

const typeOf = (schema: unknown, namedRefs: Record<string, string>): string =>
  jsonSchemaToTs(stripRootAnnotations(schema), { namedRefs });

const describeFields = (schema: JSONSchema, indent: string, namedRefs: Record<string, string>): string[] => {
  const required = schema.required ?? [];
  return Object.entries(schema.properties ?? {}).map(([name, field]) => {
    const optional = required.includes(name) ? "" : "?";
    // The engine applies defaults before render, so the default is what omitting the field means.
    const fallback = "default" in field ? ` = ${JSON.stringify(field.default)}` : "";
    return `${indent}- ${name}${optional}: ${typeOf(field, namedRefs)}${fallback}${dashTail(field.description)}`;
  });
};

// The props object whose fields list one per line: the schema itself, or what a root `$ref` names.
const propsObject = (schema: JSONSchema): JSONSchema | null => {
  if (schema.properties) return schema;
  if (typeof schema.$ref !== "string") return null;
  const target = resolvePointer(schema.$ref, schema);
  return isSchemaObject(target) && target.properties ? target : null;
};

// Any other shape (a union, an intersection, a record) prints as one type, so the model still sees it.
const describeProps = (schema: JSONSchema, namedRefs: Record<string, string>): string[] => {
  const object = propsObject(schema);
  if (!object) return [`  Props: ${unwrapParens(typeOf(schema, namedRefs))}`];
  const fields = describeFields(object, "    ", namedRefs);
  return fields.length ? ["  Props:", ...fields] : [];
};

// What a URL prop may hold. A predicate cannot be described, so it prints nothing: say it in `note`.
const describeUrlProps = (policy: UrlPolicy | undefined): string => {
  if (typeof policy === "function") return "";
  const { allowRelative, allowSameOrigin, hosts, allowDataImages, origin } = resolveUrlPolicy(policy);
  const allowed = [
    allowRelative && "- relative URL: `/a`, `a/b`, `?q=1`, `#x`",
    allowSameOrigin && `- absolute URL on ${origin ? `\`${origin}\`` : "this site"}`,
    hosts.length > 0 && `- http or https URL on ${hosts.map((host) => `\`${host}\``).join(", ")}`,
    "- `mailto:`, `tel:` or `sms:` link",
    allowDataImages && "- `data:` image, not SVG",
  ].filter(Boolean);
  return `## URL Props\n\nURL-format props (\`format uri\`, \`format uri-reference\`) take only:\n${allowed.join("\n")}\n\nOther URLs fail element.`;
};

// A payload with an `id` converts to a root `$ref` into `$defs`; the def's key is the event's name.
const eventName = (schema: JSONSchema): string | undefined => {
  const name = schema.$ref?.startsWith("#/$defs/") ? schema.$ref.slice("#/$defs/".length) : undefined;
  return name && schema.$defs?.[name] ? name : undefined;
};

// A callback payload with an `id` is a common event; two different payloads under one `id` throw.
const commonEvents = (defs: ComponentDefinition[]): Map<string, JSONSchema> => {
  const events = new Map<string, { schema: JSONSchema; fingerprint: string }>();
  for (const def of defs) {
    for (const spec of Object.values(def.callbacks ?? {})) {
      const schema = specToJSONSchema(spec);
      const name = eventName(schema);
      if (!name) continue;
      const fingerprint = JSON.stringify(schema);
      const known = events.get(name);
      if (known && known.fingerprint !== fingerprint) {
        throw new Error(
          `Two callbacks declare the event "${name}" with different payloads — a shared \`id\` must name one shape.`,
        );
      }
      if (!known) events.set(name, { schema, fingerprint });
    }
  }
  return new Map([...events].map(([id, { schema }]) => [id, schema]));
};

/**
 * The component menu, from your definitions. A payload with an `id` prints once, under `## Common Events`; a URL
 * prop adds `## URL Props`. Throws on a duplicate name, or on two different payloads with one `id`.
 *
 * @example
 * getComponentsPartialPrompt({ definitions: defs });
 *
 * @example
 * getComponentsPartialPrompt({ definitions: [...defs, BadgeDef], urlPolicy: { hosts: ["cdn.example.com"] } });
 */
export function getComponentsPartialPrompt({ definitions: defs, urlPolicy, note }: ComponentsPromptOptions): string {
  const names = new Set<string>();
  for (const { name } of defs) {
    if (names.has(name)) throw new Error(`Duplicate component name: "${name}"`);
    names.add(name);
  }
  const visible = defs.filter((def) => !def.hidden);
  // A heading with nothing under it is dropped.
  if (visible.length === 0) return noteSection(note);

  // One registry for the block: a `$def` shared by an event payload and a prop prints once.
  const shared = collectSharedTypes();
  const events = commonEvents(visible);
  const eventLines = [...events].flatMap(([name, schema]) => {
    const refs = shared.add(schema);
    const payload = schema.$defs?.[name] as JSONSchema;
    const tail = dashTail(payload.description);
    const fields = describeFields(payload, "  ", refs);
    return fields.length ? [`- ${name}${tail}`, ...fields] : [`- ${name}: ${typeOf(payload, refs)}${tail}`];
  });

  let hasUrlProps = false;
  const details = visible.map(({ name, description, props, callbacks }) => {
    const propsSchema = specToJSONSchema(props);
    hasUrlProps ||= schemaHasUrlFormat(propsSchema);
    const propLines = describeProps(propsSchema, shared.add(propsSchema));
    const handlers = Object.entries(callbacks ?? {}).flatMap(([callback, spec]) => {
      const schema = specToJSONSchema(spec);
      const refs = shared.add(schema);
      const event = eventName(schema);
      if (event && events.has(event)) return [`    - ${callback}(evt: ${event})`];
      // The description documents the handler, not its `evt`.
      const tail = dashTail(schema.description);
      if (schema.type === "null") return [`    - ${callback}()${tail}`];
      const fields = describeFields(schema, "      ", refs);
      if (fields.length) return [`    - ${callback}(evt)${tail}`, ...fields];
      return [`    - ${callback}(evt: ${typeOf(schema, refs)})${tail}`];
    });
    return [
      `- ${name} — ${description}`,
      ...propLines,
      ...(handlers.length ? ["  Event handlers:", ...handlers] : []),
    ].join("\n");
  });

  // After the details, so every hoisted definition is in.
  const sharedLines = shared.lines();
  const block = joinSections(
    `# Available Components\n\n${visible.map((def) => def.name).join(", ")}`,
    eventLines.length > 0 && `## Common Events\n\n${eventLines.join("\n")}`,
    `## Component Details\n\n${details.join("\n\n")}`,
    sharedLines.length > 0 && `## Shared Types\n\n${sharedLines.join("\n")}`,
    hasUrlProps && describeUrlProps(urlPolicy),
  );
  return joinSections(block.trim(), noteSection(note));
}
