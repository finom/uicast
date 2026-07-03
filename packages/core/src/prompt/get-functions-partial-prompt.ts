import type { StandardToolV0Definition } from "standard-tool";
import { JSONSchemaToTs } from "../prompt-utils/json-schema-to-ts";

/**
 * A tool's input/output schema slot — a Standard (JSON) Schema, or `undefined`
 * when the tool declares none. Derived from `StandardToolV0Definition` by indexed access
 * rather than importing the schema type by name: standard-tool has renamed that
 * type across releases, and indexed access stays correct regardless.
 */
type ToolSchema = StandardToolV0Definition["inputSchema"];

export type FunctionsPromptOptions = {
	/** The host functions to advertise — the same set handed to the renderer's `functions` prop. */
	functions: StandardToolV0Definition[];
};

/**
 * Render one of a tool's schemas (input or output) to a TypeScript-ish string.
 *
 * `undefined` schema → `fallback`: the tool declares no input, or no return
 * value. A *present* schema is rendered as-is; if it has no JSON Schema
 * representation `.input()` throws and we let it surface — that's a real
 * authoring error, not something to swallow. In particular "returns nothing"
 * must be expressed as an absent `outputSchema`, never `z.void()`: void has no
 * JSON Schema form and Zod throws on it.
 */
function schemaToTs(schema: ToolSchema, fallback: string): string {
	if (!schema) return fallback;
	return JSONSchemaToTs(
		schema["~standard"].jsonSchema.input({ target: "draft-2020-12" }),
	);
}

/**
 * Render an array of `StandardToolV0Definition`s into the prompt's function section — a
 * `# Available Functions` names list followed by `# Function Details`, one
 * Markdown bullet per tool as a TypeScript-style call signature derived from
 * the tool's Zod schemas:
 *
 *     - updateRows({ sheet: string, ... }) => void: <description>
 *
 * A tool with no `inputSchema` renders `name()`; one with no `outputSchema`
 * renders `=> void`.
 *
 * Catalog-agnostic: a caller passes whatever tool set it exposes to the LLM
 * (whatever host functions it exposes) and composes the returned block into the
 * surrounding prompt it needs (extra calling conventions, examples, …).
 * Mirrors `getComponentsPartialPrompt` — same two-section shape.
 */
export function getFunctionsPartialPrompt({
	functions: tools,
}: FunctionsPromptOptions): string {
	const names = tools.map((tool) => tool.name).join(", ");
	const details = tools
		.map(({ name, description, inputSchema, outputSchema }) => {
			const paramsTs = schemaToTs(inputSchema, "");
			const outputTs = schemaToTs(outputSchema, "void");
			return `- ${name}(${paramsTs}) => ${outputTs}: ${description}`;
		})
		.join("\n");
	return `# Available Functions\n\n${names}\n\n# Function Details\n\n${details}`;
}
