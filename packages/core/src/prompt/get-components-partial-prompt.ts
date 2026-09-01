import { dashTail, stripRootDescription } from "../prompt-utils/describe";
import { type JSONSchema, JSONSchemaToTs } from "../prompt-utils/json-schema-to-ts";
import { collectSharedTypes } from "../prompt-utils/shared-types";
import { specToJSONSchema } from "../prompt-utils/spec-to-json-schema";
import type { ComponentDefinition } from "../types";
import { noteSection } from "./note-section";

export type ComponentsPromptOptions = {
	/** The component defs to advertise — the catalog's `allDefinitions` (plus any app-local defs). */
	definitions: ComponentDefinition[];
	/** Host-specific context, appended as this section's trailing `## Note`. */
	note?: string;
};

/** Object-schema properties as an indented bullet list (`- count?: number — ...`); non-object schemas yield `[]`. */
const describeFields = (
	schema: JSONSchema,
	indent: string,
	namedRefs: Record<string, string>,
): string[] => {
	if (!schema?.properties) return [];
	const required = schema.required ?? [];
	return Object.entries(schema.properties).map(([name, field]) => {
		const optional = required.includes(name) ? "" : "?";
		// The engine applies schema defaults before render, so the default IS
		// what omitting the field means — print it or the model can only guess.
		const fallback =
			field !== null && typeof field === "object" && "default" in field
				? ` = ${JSON.stringify((field as { default?: unknown }).default)}`
				: "";
		return `${indent}- ${name}${optional}: ${JSONSchemaToTs(stripRootDescription(field), { namedRefs })}${fallback}${dashTail(field.description)}`;
	});
};

/**
 * Defs → `# Available Components` / `# Common Events` / `# Component Details` /
 * `# Shared Types`. Hidden defs are skipped; duplicate names throw.
 */
export function getComponentsPartialPrompt({
	definitions: defs,
	note,
}: ComponentsPromptOptions): string {
	const seen = new Set<string>();
	for (const def of defs) {
		if (seen.has(def.name)) {
			throw new Error(`Duplicate component name: "${def.name}"`);
		}
		seen.add(def.name);
	}

	const visible = defs.filter((def) => !def.hidden);

	// One registry for the whole block: a `$def` shared by an event payload and
	// a component prop is printed once and named the same in both.
	const shared = collectSharedTypes();

	// Common events, derived from the defs: any callback payload carrying a `$id`
	// is a named, shared event. Collect one schema per `$id` (first seen), and
	// reject two callbacks that name the same `$id` with different payloads — a
	// shared id must mean one shape.
	const commonSchemas = new Map<string, JSONSchema>();
	const commonFingerprints = new Map<string, string>();
	for (const def of visible) {
		for (const cbDef of Object.values(def.callbacks ?? {})) {
			const jsonSchema = specToJSONSchema(cbDef);
			const id = jsonSchema.$id;
			if (!id) continue;
			const fingerprint = JSON.stringify(jsonSchema);
			if (commonSchemas.has(id)) {
				if (commonFingerprints.get(id) !== fingerprint) {
					throw new Error(
						`Two callbacks declare the event "${id}" with different payloads — a shared \`$id\` must name one shape.`,
					);
				}
				continue;
			}
			commonSchemas.set(id, jsonSchema);
			commonFingerprints.set(id, fingerprint);
		}
	}

	const commonLines: string[] = [];
	for (const [id, jsonSchema] of commonSchemas) {
		const refs = shared.add(jsonSchema);
		const tail = dashTail(jsonSchema.description);
		// An object payload lists its fields as bullets, the same shape a
		// component's own callback options take — one style for event fields
		// wherever they appear. Anything else (a `null` payload, a union) has no
		// fields to list, so it keeps the inline type.
		const fieldLines = describeFields(jsonSchema, "  ", refs);
		if (fieldLines.length) {
			commonLines.push(`- ${id}${tail}`, ...fieldLines);
		} else {
			const ts = JSONSchemaToTs(stripRootDescription(jsonSchema), { namedRefs: refs });
			commonLines.push(`- ${id}: ${ts}${tail}`);
		}
	}

	const detail = visible
		.map(({ name, description, props, callbacks }) => {
			const lines = [`- ${name} — ${description}`];

			const propsJSONSchema = specToJSONSchema(props);
			const propLines = describeFields(
				propsJSONSchema,
				"    ",
				shared.add(propsJSONSchema),
			);
			if (propLines.length) lines.push("  Props:", ...propLines);

			const callbackLines = Object.entries(callbacks || {}).flatMap(
				([cbName, cbDef]) => {
					const cbJSONSchema = specToJSONSchema(cbDef);
					const cbRefs = shared.add(cbJSONSchema);
					const id = cbJSONSchema.$id;
					if (id && commonSchemas.has(id)) {
						// Common event — its payload is named + described once under
						// `# Common Events`; reference it instead of re-inlining here.
						return [`    - ${cbName}(evt: ${id})`];
					}
					// The description documents the handler itself, not its `evt`
					// argument — append it after the signature, as common events do.
					const tail = dashTail(cbJSONSchema.description);
					// A `null` payload means the handler carries no event data — render
					// it as a no-arg call rather than `(evt: null)`.
					if (cbJSONSchema.type === "null") {
						return [`    - ${cbName}()${tail}`];
					}
					// An object payload's fields are the event's options — list them
					// like props, one level deeper. Anything else keeps the inline type.
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

	return [
		(
			"# Available Components\n\n" +
			visible.map((def) => def.name).join(", ") +
			(commonLines.length
				? `\n\n# Common Events\n\n${commonLines.join("\n")}`
				: "") +
			"\n\n# Component Details\n\n" +
			detail +
			(sharedLines.length
				? `\n\n# Shared Types\n\n${sharedLines.join("\n")}`
				: "")
			// No edge blank lines — assembly's `\n\n` join owns the separators.
		).trim(),
		noteSection(note),
	]
		.filter(Boolean)
		.join("\n\n");
}
