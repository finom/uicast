import { type JSONSchema, JSONSchemaToTs } from "../prompt-utils/json-schema-to-ts";
import { collectSharedTypes } from "../prompt-utils/shared-types";
import type { CombinedSpec, ComponentDefinition } from "../types";

const toJSONSchema = (spec: CombinedSpec): unknown =>
  spec["~standard"].jsonSchema.input({ target: "draft-2020-12" });

const readId = (jsonSchema: unknown): string | undefined =>
  (jsonSchema as { $id?: string } | null)?.$id;

// This builder prints a node's own description after an em-dash, so drop it
// from the schema before type rendering — otherwise `JSONSchemaToTs` (which
// annotates described nodes inline) would say it twice. Only the ROOT is
// stripped: descriptions nested inside the type still render as inline
// comments, which is the only place they can appear.
const stripRootDescription = (jsonSchema: unknown): unknown =>
  jsonSchema !== null && typeof jsonSchema === "object"
    ? { ...(jsonSchema as JSONSchema), description: undefined }
    : jsonSchema;

export type ComponentsPromptOptions = {
  /** The component defs to advertise — the catalog's `allDefinitions` (plus any app-local defs). */
  definitions: ComponentDefinition[];
  /** Shared event schemas (each with a JSON Schema `$id`), rendered once under `# Common Events`. */
  commonEvents?: CombinedSpec[];
};

/**
 * Render an object schema's properties as an indented, described bullet list:
 *
 *     - count?: number — The number to display
 *
 * Each field's type comes from `JSONSchemaToTs`; its `description` (when set)
 * follows after an em-dash. A non-object schema, or one without properties,
 * yields `[]`. Shared by a component's props and a typed event's options — both
 * are "object schema → described fields".
 */
const describeFields = (
  jsonSchema: unknown,
  indent: string,
  namedRefs: Record<string, string>,
): string[] => {
  const schema = jsonSchema as JSONSchema | null;
  if (!schema?.properties) return [];
  const required = schema.required ?? [];
  return Object.entries(schema.properties).map(([name, field]) => {
    const optional = required.includes(name) ? "" : "?";
    const description = field.description;
    return `${indent}- ${name}${optional}: ${JSONSchemaToTs(stripRootDescription(field), { namedRefs })}${
      description ? ` — ${description}` : ""
    }`;
  });
};

/**
 * Render an array of component defs into the prompt's component section — a
 * `# Available Components` names list, an optional `# Shared Types` block, an
 * optional `# Common Events` block, then
 * `# Component Details`, one entry per visible def: its name + description, a
 * `Props:` list (each prop's type + description) and an `Event handlers:` list
 * (each handler's signature + description, a typed event's options described one
 * level deeper). Types come from `JSONSchemaToTs`; every description rides after
 * an em-dash, so nothing the author wrote on a prop, option, or handler is lost.
 *
 * `commonEvents` hoists handlers shared across many components (e.g. `onClick`)
 * out of every entry. Each passed schema must carry a JSON Schema `$id`; its
 * payload is rendered once as a named type under `# Common Events`, and a
 * component whose callback is one of them references it as `evt: <$id>` instead
 * of re-inlining the payload — killing the per-component duplication. A callback
 * is matched by its `$id`, so it stays library-agnostic (anything that emits
 * `$id` participates); non-common callbacks render inline as before.
 *
 * `# Shared Types` does the same job for schema `$defs` / `definitions`: each is
 * printed once as a named type and referenced by name at every use site, which
 * both removes the repetition of inlining and lets a RECURSIVE type be stated
 * (inlined, its back-edge degrades to `unknown`).
 *
 * Host-only defs (`hidden: true`, e.g. RootFragment) are filtered out so the LLM
 * never sees host infrastructure in its component menu. Catalog-agnostic: the
 * caller passes whatever def set + common events it exposes.
 *
 * Mirrors `getFunctionsPartialPrompt` — same `# Available X` / `# X Details`
 * two-section shape.
 *
 * Throws on a duplicate component `name`, a common event whose schema has no
 * `$id`, or a duplicate common event `$id`.
 */
export function getComponentsPartialPrompt({
  definitions: defs,
  commonEvents = [],
}: ComponentsPromptOptions): string {
  const seen = new Set<string>();
  for (const def of defs) {
    if (seen.has(def.name)) {
      throw new Error(`Duplicate component name: "${def.name}"`);
    }
    seen.add(def.name);
  }

  // Index the common events by `$id`, rendering each once. A missing `$id`
  // would leave the handler unmatchable (it would silently inline on every
  // component), so it's a hard error — as is a duplicate id, which would make
  // the per-component reference ambiguous.
  // One registry for the whole block: a `$def` shared by an event payload and a
  // component prop is printed once and named the same in both.
  const shared = collectSharedTypes();

  const commonIds = new Set<string>();
  const commonLines: string[] = [];
  for (const schema of commonEvents) {
    const jsonSchema = toJSONSchema(schema);
    const id = readId(jsonSchema);
    if (!id) {
      throw new Error(
        'Common event schema is missing a JSON Schema `$id` (add e.g. .meta({ $id: "onClick" }))',
      );
    }
    if (commonIds.has(id)) {
      throw new Error(`Duplicate common event id: "${id}"`);
    }
    commonIds.add(id);
    const ts = JSONSchemaToTs(stripRootDescription(jsonSchema), {
      namedRefs: shared.add(jsonSchema),
    });
    const description = (jsonSchema as { description?: string }).description;
    commonLines.push(`- ${id}: ${ts}${description ? ` — ${description}` : ""}`);
  }

  const visible = defs.filter((def) => !def.hidden);

  const detail = visible
    .map(({ name, description, props, callbacks }) => {
      const lines = [`- ${name} — ${description}`];

      const propsJSONSchema = toJSONSchema(props);
      const propLines = describeFields(
        propsJSONSchema,
        "    ",
        shared.add(propsJSONSchema),
      );
      if (propLines.length) lines.push("  Props:", ...propLines);

      const callbackLines = Object.entries(callbacks || {}).flatMap(
        ([cbName, cbDef]) => {
          const cbJSONSchema = toJSONSchema(cbDef);
          const cbRefs = shared.add(cbJSONSchema);
          const id = readId(cbJSONSchema);
          if (id && commonIds.has(id)) {
            // Common event — its payload is named + described once under
            // `# Common Events`; reference it instead of re-inlining here.
            return [`    - ${cbName}(evt: ${id})`];
          }
          // The description documents the handler itself, not its `evt`
          // argument — append it after the signature, as common events do.
          const cbDescription = (cbJSONSchema as JSONSchema | null)?.description;
          const tail = cbDescription ? ` — ${cbDescription}` : "";
          // A `null` payload means the handler carries no event data — render it
          // as a no-arg call rather than `(evt: null)`.
          if ((cbJSONSchema as JSONSchema | null)?.type === "null") {
            return [`    - ${cbName}()${tail}`];
          }
          // An object payload's fields are the event's options — list them like
          // props, one level deeper. Anything else keeps the inline `evt` type.
          const optionLines = describeFields(cbJSONSchema, "      ", cbRefs);
          if (optionLines.length) {
            return [`    - ${cbName}(evt)${tail}`, ...optionLines];
          }
          return [
            `    - ${cbName}(evt: ${JSONSchemaToTs(stripRootDescription(cbJSONSchema), { namedRefs: cbRefs })})${tail}`,
          ];
        },
      );
      if (callbackLines.length) lines.push("  Event handlers:", ...callbackLines);

      return lines.join("\n");
    })
    .join("\n\n");

  // Asked for after `detail` is built, so every hoisted definition is in.
  const sharedLines = shared.lines();

  return (
    "# Available Components\n\n" +
    visible.map((def) => def.name).join(", ") +
    (sharedLines.length
      ? `\n\n# Shared Types\n\n${sharedLines.join("\n")}`
      : "") +
    (commonLines.length
      ? `\n\n# Common Events\n\n${commonLines.join("\n")}`
      : "") +
    "\n\n# Component Details\n\n" +
    detail
    // Trimmed: every partial is documented to carry no leading or trailing
    // blank lines, so assembly (a `\n\n` join) owns the separators.
  ).trim();
}
