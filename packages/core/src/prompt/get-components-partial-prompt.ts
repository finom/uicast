import { dashTail, stripRootAnnotations, unwrapParens } from "../prompt-utils/describe";
import { isSchemaObject, type JSONSchema, jsonSchemaToTs, resolveRef } from "../prompt-utils/json-schema-to-ts";
import { collectSharedTypes } from "../prompt-utils/shared-types";
import { specToJSONSchema } from "../prompt-utils/spec-to-json-schema";
import { resolveUrlPolicy, schemaHasUrlFormat, type UrlPolicy } from "../security/url-policy";
import type { ComponentDefinition } from "../types";
import { noteSection } from "./note-section";

export type ComponentsPromptOptions = {
	definitions: ComponentDefinition[];
	// The renderer's `urlPolicy`, so the model writes URLs the renderer loads. Omitted, the renderer's defaults.
	urlPolicy?: UrlPolicy;
	// Host-specific context, appended as this section's trailing `## Note`.
	note?: string;
};

const describeFields = (
	schema: JSONSchema,
	indent: string,
	namedRefs: Record<string, string>,
): string[] => {
	if (!schema.properties) return [];
	const required = schema.required ?? [];
	return Object.entries(schema.properties).map(([name, field]) => {
		const optional = required.includes(name) ? "" : "?";
		// The engine applies defaults before render, so the default is what omitting the field means.
		const fallback = "default" in field ? ` = ${JSON.stringify(field.default)}` : "";
		return `${indent}- ${name}${optional}: ${jsonSchemaToTs(stripRootAnnotations(field), { namedRefs })}${fallback}${dashTail(field.description)}`;
	});
};

// The props object whose fields list one per line: the schema itself, or what a root `$ref` names.
const propsObject = (schema: JSONSchema): JSONSchema | null => {
	if (schema.properties) return schema;
	if (typeof schema.$ref !== "string") return null;
	const target = resolveRef(schema.$ref, schema);
	return isSchemaObject(target) && target.properties ? target : null;
};

// Any other shape (a union, an intersection, a record) prints as one type, so the model still sees it.
const describeProps = (schema: JSONSchema, namedRefs: Record<string, string>): string[] => {
	const object = propsObject(schema);
	if (!object) return [`  Props: ${unwrapParens(jsonSchemaToTs(stripRootAnnotations(schema), { namedRefs }))}`];
	const fields = describeFields(object, "    ", namedRefs);
	return fields.length ? ["  Props:", ...fields] : [];
};

// What a URL prop may hold. A predicate cannot be described, so it prints nothing: say it in `note`.
const describeUrlProps = (policy: UrlPolicy | undefined): string => {
	if (typeof policy === "function") return "";
	const { allowRelative, allowSameOrigin, hosts, allowDataImages, origin } = resolveUrlPolicy(policy);
	const allowed = [
		allowRelative && "- a relative URL: `/a`, `a/b`, `?q=1`, `#x`",
		allowSameOrigin && `- an absolute URL on ${origin ? `\`${origin}\`` : "this site"}`,
		hosts.length > 0 && `- an http or https URL on ${hosts.map((host) => `\`${host}\``).join(", ")}`,
		"- a `mailto:`, `tel:` or `sms:` link",
		allowDataImages && "- a `data:` image, not SVG",
	].filter(Boolean);
	return `# URL Props\n\nA prop typed with a URL format (\`format uri\`, \`format uri-reference\`) must hold one of:\n${allowed.join("\n")}\n\nAny other URL fails the element.`;
};

export function getComponentsPartialPrompt({
	definitions: defs,
	urlPolicy,
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
	// A heading with nothing under it is dropped.
	if (visible.length === 0) return noteSection(note);

	// One registry for the block: a `$def` shared by an event payload and a prop prints once.
	const shared = collectSharedTypes();

	// A callback payload carrying a `$id` is a common event; two different payloads under one `$id` throw.
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
		const fieldLines = describeFields(jsonSchema, "  ", refs);
		if (fieldLines.length) {
			commonLines.push(`- ${id}${tail}`, ...fieldLines);
		} else {
			const ts = jsonSchemaToTs(stripRootAnnotations(jsonSchema), { namedRefs: refs });
			commonLines.push(`- ${id}: ${ts}${tail}`);
		}
	}

	let hasUrlProps = false;
	const detail = visible
		.map(({ name, description, props, callbacks }) => {
			const lines = [`- ${name} — ${description}`];

			const propsJSONSchema = specToJSONSchema(props);
			hasUrlProps ||= schemaHasUrlFormat(propsJSONSchema);
			lines.push(...describeProps(propsJSONSchema, shared.add(propsJSONSchema)));

			const callbackLines = Object.entries(callbacks || {}).flatMap(
				([cbName, cbDef]) => {
					const cbJSONSchema = specToJSONSchema(cbDef);
					const cbRefs = shared.add(cbJSONSchema);
					const id = cbJSONSchema.$id;
					if (id && commonSchemas.has(id)) {
						return [`    - ${cbName}(evt: ${id})`];
					}
					// The description documents the handler, not its `evt`.
					const tail = dashTail(cbJSONSchema.description);
					if (cbJSONSchema.type === "null") {
						return [`    - ${cbName}()${tail}`];
					}
					const optionLines = describeFields(cbJSONSchema, "      ", cbRefs);
					if (optionLines.length) {
						return [`    - ${cbName}(evt)${tail}`, ...optionLines];
					}
					return [
						`    - ${cbName}(evt: ${jsonSchemaToTs(stripRootAnnotations(cbJSONSchema), { namedRefs: cbRefs })})${tail}`,
					];
				},
			);
			if (callbackLines.length) lines.push("  Event handlers:", ...callbackLines);

			return lines.join("\n");
		})
		.join("\n\n");

	// After `detail`, so every hoisted definition is in.
	const sharedLines = shared.lines();
	const urlSection = hasUrlProps ? describeUrlProps(urlPolicy) : "";

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
				: "") +
			(urlSection ? `\n\n${urlSection}` : "")
			// Assembly's `\n\n` join owns the separators.
		).trim(),
		noteSection(note),
	]
		.filter(Boolean)
		.join("\n\n");
}
