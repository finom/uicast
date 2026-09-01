import type { StandardToolV0 } from "standard-tool";
import { JSONSchemaToTs } from "../prompt-utils/json-schema-to-ts";
import { collectSharedTypes, type SharedTypes } from "../prompt-utils/shared-types";
import { specToJSONSchema } from "../prompt-utils/spec-to-json-schema";
import { functionNameFault } from "../expr/function-name";
import { noteSection } from "./note-section";

/** A tool's schema slot. Indexed access — standard-tool has renamed the type across releases. */
type ToolSchema = StandardToolV0["inputSchema"];

export type FunctionsPromptOptions = {
	/** The host functions to advertise — the same set handed to the renderer's `functions` prop. */
	functions: StandardToolV0[];
	/** Host-specific context, appended as this section's trailing `## Note`. */
	note?: string;
};

/**
 * One tool schema as a TypeScript-ish string; `undefined` → `fallback`.
 * A schema with no JSON Schema form throws (authoring error, e.g. `z.void()`).
 */
function schemaToTs(
	schema: ToolSchema,
	fallback: string,
	shared: SharedTypes,
): string {
	if (!schema) return fallback;
	const jsonSchema = specToJSONSchema(schema);
	// Multiline with a two-space pad: the signature spans several lines inside
	// its Markdown bullet, one field per line, so per-field descriptions stay
	// readable instead of running together on one long line.
	return JSONSchemaToTs(jsonSchema, {
		multiline: "  ",
		namedRefs: shared.add(jsonSchema),
	});
}

/** Tools → `# Available Functions` / `# Function Details` / `# Shared Types`. No `outputSchema` renders `=> unknown` — undeclared, not empty. */
export function getFunctionsPartialPrompt({
	functions,
	note,
}: FunctionsPromptOptions): string {
	const seen = new Set<string>();
	for (const { name } of functions) {
		// Same screen as `evaluate` — a name advertised here must be callable there.
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
	// Rendered first, so `shared` holds every hoisted definition by the time the
	// block below asks for its lines.
	const details = functions
		.map(({ name, title, description, inputSchema, outputSchema }) => {
			const paramsTs = schemaToTs(inputSchema, "", shared);
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
