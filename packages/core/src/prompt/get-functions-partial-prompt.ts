import type { StandardToolV0 } from "standard-tool";
import { JSONSchemaToTs } from "../prompt-utils/json-schema-to-ts";
import { collectSharedTypes, type SharedTypes } from "../prompt-utils/shared-types";
import { specToJSONSchema } from "../prompt-utils/spec-to-json-schema";

/**
 * A tool's input/output schema slot — a Standard (JSON) Schema, or `undefined`
 * when the tool declares none. Derived from `StandardToolV0` by indexed access
 * rather than importing the schema type by name: standard-tool has renamed that
 * type across releases, and indexed access stays correct regardless.
 */
type ToolSchema = StandardToolV0["inputSchema"];

export type FunctionsPromptOptions = {
	/** The host functions to advertise — the same set handed to the renderer's `functions` prop. */
	functions: StandardToolV0[];
};

/**
 * One tool schema (input or output) as a TypeScript-ish string; `undefined` →
 * `fallback`. A present schema with no JSON Schema form throws — a real
 * authoring error (e.g. `z.void()` for "nothing"), not something to swallow.
 * Definitions are hoisted into `shared` as a side effect.
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

// The names an expression's context already binds. A tool is merged over that
// context (`{ ...context, ...functions }` in `evaluate`), so a tool taking one
// of these silently shadows it — and the resulting failure is reported against
// the expression that read `scopes`, not against the host that renamed it.
const RESERVED_FUNCTION_NAMES = new Set(["scopes", "evt", "currentValue"]);

/**
 * Render `StandardToolV0`s into the prompt's function section:
 * `# Available Functions`, then `# Function Details` — one bullet per tool as
 * a TypeScript-style signature (`- updateRows({ sheet: string }) => unknown:
 * <description>`, the optional `title` before the description). No
 * `inputSchema` renders `name()`; no `outputSchema` renders `=> unknown` —
 * *undeclared*, not "returns nothing": the contract forbids reading fields off
 * it. Shared `$defs` hoist into a trailing `# Shared Types` block, same shape
 * as `getComponentsPartialPrompt`.
 */
export function getFunctionsPartialPrompt({
	functions,
}: FunctionsPromptOptions): string {
	const seen = new Set<string>();
	for (const { name } of functions) {
		if (RESERVED_FUNCTION_NAMES.has(name)) {
			throw new Error(
				`Host function name "${name}" is reserved — it would shadow the expression context of the same name`,
			);
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
	return (
		`# Available Functions\n\n${names}` +
		`\n\n# Function Details\n\n${details}` +
		(sharedLines.length
			? `\n\n# Shared Types\n\n${sharedLines.join("\n")}`
			: "")
	).trim();
}
