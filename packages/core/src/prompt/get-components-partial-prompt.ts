import { JSONSchemaToTs } from "../prompt-utils/json-schema-to-ts";
import type { ComponentDefinition } from "../types";

/**
 * Render an array of component defs into the prompt's component section — a
 * `# Available Components` names list followed by `# Component Details`, one
 * Markdown entry per visible def (its prop schema rendered to a TypeScript-ish
 * type via `JSONSchemaToTs`, its description, and any callback signatures).
 *
 * Host-only defs (`hidden: true`, e.g. Fragment) are filtered out so the LLM
 * never sees host infrastructure in its component menu. Catalog-agnostic: the
 * caller passes whatever def set it exposes.
 *
 * Mirrors `getFunctionsPartialPrompt` — same `# Available X` / `# X Details`
 * two-section shape.
 *
 * Throws on a duplicate `name` across `defs`. The catalog registry is a flat
 * array (`defs.ts`), which lost the keyed-object registry's free uniqueness —
 * since this is the one place every def is consumed by name, it's the
 * enforcement point.
 */
export function getComponentsPartialPrompt(defs: ComponentDefinition[]): string {
	const seen = new Set<string>();
	for (const def of defs) {
		if (seen.has(def.name)) {
			throw new Error(`Duplicate component name: "${def.name}"`);
		}
		seen.add(def.name);
	}
	const visible = defs.filter((def) => !def.hidden);
	return (
		"# Available Components\n\n" +
		visible.map((def) => def.name).join(", ") +
		"\n\n# Component Details\n\n" +
		visible
			.map(({ name, description, props, callbacks }) => {
				const propsJSONSchema = props["~standard"].jsonSchema.input({
					target: "draft-2020-12",
				});
				const propsTs = JSONSchemaToTs(propsJSONSchema);
				const callbackSubPrompt = Object.entries(callbacks || {})
					.map(([cbName, cbDef]) => {
						const cbDefJSONSchema = cbDef["~standard"].jsonSchema.input({
							target: "draft-2020-12",
						});
						const cbDefTs = JSONSchemaToTs(cbDefJSONSchema);
						return `  - ${cbName}(evt: ${cbDefTs})`;
					})
					.join("\n");
				return `- ${name}: ${propsTs} - ${description}; ${callbackSubPrompt ? `Event handlers:\n${callbackSubPrompt}` : ""}`;
			})
			.join("\n")
	);
}
