import type { StandardToolV0 } from "standard-tool";
import { JSONSchemaToTs } from "../prompt-utils/json-schema-to-ts";
import { collectSharedTypes, type SharedTypes } from "../prompt-utils/shared-types";

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
 * Render one of a tool's schemas (input or output) to a TypeScript-ish string.
 *
 * `undefined` schema → `fallback`. A *present* schema is rendered as-is; if it
 * has no JSON Schema representation `.input()` throws and we let it surface —
 * that's a real authoring error, not something to swallow. In particular a
 * schema for "nothing" must never be `z.void()`: void has no JSON Schema form
 * and Zod throws on it.
 *
 * Definitions are hoisted into `shared` as a side effect, so the caller can
 * print them once and each use site here references them by name.
 */
function schemaToTs(
	schema: ToolSchema,
	fallback: string,
	shared: SharedTypes,
): string {
	if (!schema) return fallback;
	const jsonSchema = schema["~standard"].jsonSchema.input({
		target: "draft-2020-12",
	});
	// Multiline with a two-space pad: the signature spans several lines inside
	// its Markdown bullet, one field per line, so per-field descriptions stay
	// readable instead of running together on one long line.
	return JSONSchemaToTs(jsonSchema, {
		multiline: "  ",
		namedRefs: shared.add(jsonSchema),
	});
}

/**
 * Render an array of `StandardToolV0`s into the prompt's function section — a
 * `# Available Functions` names list followed by `# Function Details`, one
 * Markdown bullet per tool as a TypeScript-style call signature derived from
 * the tool's Zod schemas:
 *
 *     - updateRows({ sheet: string, ... }) => unknown: <description>
 *
 * A tool with no `inputSchema` renders `name()`; one with no `outputSchema`
 * renders `=> unknown` — absent means *undeclared*, not "returns nothing", and
 * the contract tells the model an `unknown` result may be produced but not read
 * field-by-field. Shared `$defs` across the tool set are hoisted into a
 * `# Shared Types` block and referenced by name.
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
	const shared = collectSharedTypes();
	// Rendered first, so `shared` holds every hoisted definition by the time the
	// block below asks for its lines.
	const details = tools
		.map(({ name, description, inputSchema, outputSchema }) => {
			const paramsTs = schemaToTs(inputSchema, "", shared);
			const outputTs = schemaToTs(outputSchema, "unknown", shared);
			return `- ${name}(${paramsTs}) => ${outputTs}: ${description}`;
		})
		.join("\n");
	const sharedLines = shared.lines();
	return (
		`# Available Functions\n\n${names}` +
		(sharedLines.length
			? `\n\n# Shared Types\n\n${sharedLines.join("\n")}`
			: "") +
		`\n\n# Function Details\n\n${details}`
	).trim();
}
