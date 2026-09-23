import type { CombinedSpec } from "../types";
import type { JSONSchema } from "./json-schema-to-ts";

const DEFS = "#/$defs/";

const collectRefs = (node: unknown, out: string[]): void => {
	if (Array.isArray(node)) {
		for (const item of node) collectRefs(item, out);
	} else if (node !== null && typeof node === "object") {
		for (const [key, value] of Object.entries(node)) {
			if (key === "$ref" && typeof value === "string") out.push(value);
			else collectRefs(value, out);
		}
	}
};

const renameRefs = (node: unknown, renamed: Map<string, string>): unknown => {
	if (Array.isArray(node)) return node.map((item) => renameRefs(item, renamed));
	if (node === null || typeof node !== "object") return node;
	return Object.fromEntries(
		Object.entries(node).map(([key, value]) => [
			key,
			key === "$ref" && typeof value === "string" ? (renamed.get(value) ?? value) : renameRefs(value, renamed),
		]),
	);
};

// A def that is only a `$ref` is an alias. When nothing else uses its target, both are one type under the alias's name.
// zod emits such a pair for a recursive schema given a new description.
const foldAliasDefs = (schema: JSONSchema): JSONSchema => {
	const defs = schema.$defs;
	if (!defs) return schema;
	const targetOf = (node: unknown): string | undefined => {
		const ref = (node as JSONSchema | null)?.$ref;
		return typeof ref === "string" && ref.startsWith(DEFS) && ref.slice(DEFS.length) in defs ? ref : undefined;
	};
	const used: string[] = [];
	collectRefs({ ...schema, $defs: undefined }, used);
	for (const node of Object.values(defs)) if (!targetOf(node)) collectRefs(node, used);

	const renamed = new Map<string, string>();
	const merged: Record<string, unknown> = { ...defs };
	for (const [key, node] of Object.entries(defs)) {
		const target = targetOf(node);
		if (!target || used.includes(target) || renamed.has(target)) continue;
		const { $ref, ...annotations } = node as JSONSchema;
		merged[key] = { ...(defs[target.slice(DEFS.length)] as object), ...annotations };
		renamed.set(target, DEFS + key);
	}
	if (renamed.size === 0) return schema;
	const kept = Object.fromEntries(Object.entries(merged).filter(([key]) => !renamed.has(DEFS + key)));
	return renameRefs({ ...schema, $defs: kept }, renamed) as JSONSchema;
};

export const specToJSONSchema = (spec: CombinedSpec): JSONSchema =>
	foldAliasDefs(spec["~standard"].jsonSchema.input({ target: "draft-2020-12" }) as JSONSchema);
