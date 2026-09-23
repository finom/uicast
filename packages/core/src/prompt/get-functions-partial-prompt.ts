import type { StandardToolV0 } from "standard-tool";
import { unwrapParens } from "../prompt-utils/describe";
import { jsonSchemaToTs } from "../prompt-utils/json-schema-to-ts";
import { collectSharedTypes, type SharedTypes } from "../prompt-utils/shared-types";
import { specToJSONSchema } from "../prompt-utils/spec-to-json-schema";
import { functionNameFault } from "../expr/function-name";
import { noteSection } from "./note-section";

// Indexed access: standard-tool has renamed the type across releases.
type ToolSchema = StandardToolV0["inputSchema"];

export type FunctionsPromptOptions = {
	functions: StandardToolV0[];
	// Host-specific context, appended as this section's trailing `## Note`.
	note?: string;
};

// A schema with no JSON Schema form (`z.void()`) throws: an authoring error.
function schemaToTs(
	schema: ToolSchema,
	fallback: string,
	shared: SharedTypes,
): string {
	if (!schema) return fallback;
	const jsonSchema = specToJSONSchema(schema);
	// One field per line inside the Markdown bullet, so per-field descriptions stay readable.
	return jsonSchemaToTs(jsonSchema, {
		multiline: "  ",
		namedRefs: shared.add(jsonSchema),
	});
}

// No `outputSchema` renders `=> unknown`: undeclared, not empty.
export function getFunctionsPartialPrompt({
	functions,
	note,
}: FunctionsPromptOptions): string {
	// A heading with nothing under it is dropped.
	if (functions.length === 0) return noteSection(note);
	const seen = new Set<string>();
	for (const { name } of functions) {
		// A superset of what evaluation refuses, so an advertised name is always callable.
		const fault = functionNameFault(name);
		if (fault) {
			throw new Error(`Host function name "${name}" ${fault}`);
		}
		if (seen.has(name)) {
			throw new Error(`Duplicate host function name: "${name}"`);
		}
		seen.add(name);
	}

	const names = functions.map((tool) => tool.name).join(", ");
	const shared = collectSharedTypes();
	// Rendered first, so `shared` holds every hoisted definition.
	const details = functions
		.map(({ name, title, description, inputSchema, outputSchema }) => {
			// `name(A & B)`, not `name((A & B))`.
			const paramsTs = unwrapParens(schemaToTs(inputSchema, "", shared));
			const outputTs = schemaToTs(outputSchema, "unknown", shared);
			const label = title ? `${title} — ` : "";
			return `- ${name}(${paramsTs}) => ${outputTs}: ${label}${description}`;
		})
		.join("\n");
	const sharedLines = shared.lines();
	return [
		(
			`# Available Functions\n\n${names}` +
			`\n\n# Function Details\n\n${details}` +
			(sharedLines.length
				? `\n\n# Shared Types\n\n${sharedLines.join("\n")}`
				: "")
		).trim(),
		noteSection(note),
	]
		.filter(Boolean)
		.join("\n\n");
}
