import type { CombinedSpec } from "./types";

type JSONSchemaType = "object" | "array" | "string" | "number" | "boolean" | "null" | "integer";

// The keywords uicast reads.
export interface JSONSchema {
	type?: JSONSchemaType | JSONSchemaType[];
	format?: string;
	pattern?: string;
	$ref?: string;
	items?: boolean | JSONSchema;
	prefixItems?: JSONSchema[];
	enum?: unknown[];
	minimum?: number;
	maximum?: number;
	exclusiveMinimum?: number;
	exclusiveMaximum?: number;
	multipleOf?: number;
	minItems?: number;
	maxItems?: number;
	uniqueItems?: boolean;
	default?: unknown;
	$id?: string;
	description?: string;
	properties?: { [key: string]: JSONSchema };
	patternProperties?: { [pattern: string]: JSONSchema };
	propertyNames?: JSONSchema;
	required?: string[];
	not?: JSONSchema;
	$defs?: { [key: string]: JSONSchema };
	definitions?: { [key: string]: JSONSchema };
	additionalProperties?: boolean | JSONSchema;
	unevaluatedProperties?: boolean | JSONSchema;
	unevaluatedItems?: boolean | JSONSchema;
	contains?: JSONSchema;
	dependentSchemas?: { [key: string]: JSONSchema };
	if?: JSONSchema;
	then?: JSONSchema;
	else?: JSONSchema;
	anyOf?: JSONSchema[];
	oneOf?: JSONSchema[];
	allOf?: JSONSchema[];
	const?: unknown;
	minLength?: number;
	maxLength?: number;
}

export const isSchemaObject = (node: unknown): node is JSONSchema =>
	typeof node === "object" && node !== null && !Array.isArray(node);

// `#` is the document itself. Own keys only, so a pointer never lands on a prototype member.
export const resolvePointer = (ref: string, root: unknown): unknown => {
	if (ref === "#") return root;
	if (!ref.startsWith("#/")) return undefined;
	let node: unknown = root;
	for (const segment of ref.slice(2).split("/")) {
		const key = segment.replace(/~1/g, "/").replace(/~0/g, "~");
		if (typeof node !== "object" || node === null || !Object.hasOwn(node, key)) return undefined;
		node = Reflect.get(node, key);
	}
	return node;
};

// Every `$ref` string at or under `node`.
export const collectRefs = (node: unknown, out = new Set<string>()): Set<string> => {
	if (Array.isArray(node)) {
		for (const item of node) collectRefs(item, out);
	} else if (node !== null && typeof node === "object") {
		for (const [key, value] of Object.entries(node)) {
			if (key === "$ref" && typeof value === "string") out.add(value);
			else collectRefs(value, out);
		}
	}
	return out;
};

const DEFS = "#/$defs/";

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
	const used = collectRefs({ ...schema, $defs: undefined });
	for (const node of Object.values(defs)) if (!targetOf(node)) collectRefs(node, used);

	const renamed = new Map<string, string>();
	const merged: Record<string, unknown> = { ...defs };
	for (const [key, node] of Object.entries(defs)) {
		const target = targetOf(node);
		if (!target || used.has(target) || renamed.has(target)) continue;
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
