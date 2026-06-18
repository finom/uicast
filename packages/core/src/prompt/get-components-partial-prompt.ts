import { JSONSchemaToTs } from "../prompt-utils/json-schema-to-ts";
import type { CombinedSpec, ComponentDefinition } from "../types";

const toJSONSchema = (spec: CombinedSpec): unknown =>
  spec["~standard"].jsonSchema.input({ target: "draft-2020-12" });

const readId = (jsonSchema: unknown): string | undefined =>
  (jsonSchema as { $id?: string } | null)?.$id;

/**
 * Render an array of component defs into the prompt's component section — a
 * `# Available Components` names list, an optional `# Common Events` block, then
 * `# Component Details`, one Markdown entry per visible def (its prop schema
 * rendered to a TypeScript-ish type via `JSONSchemaToTs`, its description, and
 * any callback signatures).
 *
 * `commonEvents` hoists handlers shared across many components (e.g. `onClick`)
 * out of every entry. Each passed schema must carry a JSON Schema `$id`; its
 * payload is rendered once as a named type under `# Common Events`, and a
 * component whose callback is one of them references it as `evt: <$id>` instead
 * of re-inlining the payload — killing the per-component duplication. A callback
 * is matched by its `$id`, so it stays library-agnostic (anything that emits
 * `$id` participates); non-common callbacks render inline as before.
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
export function getComponentsPartialPrompt(
  defs: ComponentDefinition[],
  commonEvents: CombinedSpec[] = [],
): string {
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
    const ts = JSONSchemaToTs(jsonSchema);
    const description = (jsonSchema as { description?: string }).description;
    commonLines.push(`- ${id}: ${ts}${description ? ` — ${description}` : ""}`);
  }

  const visible = defs.filter((def) => !def.hidden);

  const detail = visible
    .map(({ name, description, props, callbacks }) => {
      const propsTs = JSONSchemaToTs(toJSONSchema(props));
      const callbackSubPrompt = Object.entries(callbacks || {})
        .map(([cbName, cbDef]) => {
          const cbJSONSchema = toJSONSchema(cbDef);
          const id = readId(cbJSONSchema);
          if (id && commonIds.has(id)) {
            // Common event — its payload is a named type under `# Common
            // Events`; reference it instead of re-inlining on every component.
            return `  - ${cbName}(evt: ${id})`;
          }
          return `  - ${cbName}(evt: ${JSONSchemaToTs(cbJSONSchema)})`;
        })
        .join("\n");
      return `- ${name}: ${propsTs} - ${description}; ${callbackSubPrompt ? `Event handlers:\n${callbackSubPrompt}` : ""}`;
    })
    .join("\n");

  return (
    "# Available Components\n\n" +
    visible.map((def) => def.name).join(", ") +
    (commonLines.length
      ? `\n\n# Common Events\n\n${commonLines.join("\n")}`
      : "") +
    "\n\n# Component Details\n\n" +
    detail
  );
}
