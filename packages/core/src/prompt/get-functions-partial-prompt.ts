import type { StandardToolV0 } from "@uicast/expr";
import { ALLOWED_GLOBALS, hostFunctionNameFault } from "@uicast/expr/internal";
import { CONTEXT_NAMES } from "../constants";
import { specToJSONSchema } from "../json-schema";
import { joinSections, noteSection, unwrapParens } from "./format";
import { jsonSchemaToTs } from "./json-schema-to-ts";
import { collectSharedTypes, type SharedTypes } from "./shared-types";

/**
 * Options for `getFunctionsPartialPrompt`.
 *
 * @example
 * const options: FunctionsPromptOptions = { functions: tools, note: "Amounts are in cents." };
 */
export type FunctionsPromptOptions = {
  /** Your host functions: the array the evaluator binds. An empty one adds nothing. */
  functions: StandardToolV0[];
  /** Your text, appended verbatim as this section's trailing `## Note`. */
  note?: string;
};

// The message tail, or null when the name is usable. A superset of what evaluation refuses, so an advertised name is always callable.
const functionNameFault = (name: string): string | null => {
  const fault = hostFunctionNameFault(name);
  if (fault !== null) return fault;
  if (CONTEXT_NAMES.has(name)) return "is reserved — it would shadow the expression context of the same name";
  if (ALLOWED_GLOBALS.includes(name)) return "is an expression global — the function would shadow it; rename it";
  return null;
};

// A schema with no JSON Schema form (`z.void()`) throws: an authoring error.
// One field per line inside the Markdown bullet, so per-field descriptions stay readable.
const schemaToTs = (schema: StandardToolV0["inputSchema"], fallback: string, shared: SharedTypes): string => {
  if (!schema) return fallback;
  const jsonSchema = specToJSONSchema(schema);
  return jsonSchemaToTs(jsonSchema, { multiline: "  ", namedRefs: shared.add(jsonSchema) });
};

/**
 * The `# Available Functions` block: a call signature per host function, from its schemas. A tool with no
 * `outputSchema` prints `=> unknown`: undeclared, not empty. Throws on a duplicate name, a name that is not an
 * identifier, or a reserved one: `scopes`, `evt`, `currentValue` or a global such as `Math`.
 *
 * @example
 * getFunctionsPartialPrompt({ functions: tools }); // the same array as new Evaluator({ functions: tools })
 */
export function getFunctionsPartialPrompt({ functions, note }: FunctionsPromptOptions): string {
  // A heading with nothing under it is dropped.
  if (functions.length === 0) return noteSection(note);
  const seen = new Set<string>();
  for (const { name } of functions) {
    const fault = functionNameFault(name);
    if (fault) throw new Error(`Host function name "${name}" ${fault}`);
    if (seen.has(name)) throw new Error(`Duplicate host function name: "${name}"`);
    seen.add(name);
  }

  const shared = collectSharedTypes();
  // Rendered first, so `shared` holds every hoisted definition.
  const details = functions.map(({ name, title, description, inputSchema, outputSchema }) => {
    // `name(A & B)`, not `name((A & B))`.
    const params = unwrapParens(schemaToTs(inputSchema, "", shared));
    const output = schemaToTs(outputSchema, "unknown", shared);
    return `- ${name}(${params}) => ${output}: ${title ? `${title} — ` : ""}${description}`;
  });
  const sharedLines = shared.lines();
  const block = joinSections(
    `# Available Functions\n\n${functions.map((tool) => tool.name).join(", ")}`,
    `## Function Details\n\n${details.join("\n")}`,
    sharedLines.length > 0 && `## Shared Types\n\n${sharedLines.join("\n")}`,
  );
  return joinSections(block.trim(), noteSection(note));
}
