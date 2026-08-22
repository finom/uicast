type JSONSchemaType =
	| "object"
	| "array"
	| "string"
	| "number"
	| "boolean"
	| "null"
	| "integer";

/**
 * JSON Schema shape this module reads — a recursive structural type covering
 * the draft-07 / 2020-12 keywords a Standard-Schema `toJSONSchema()` can emit
 * (primitives, composition, objects, arrays/tuples, `$ref` + `$defs`, and the
 * refinement keywords that constrain a value without changing its TypeScript
 * type). Every sub-schema slot is another `JSONSchema`.
 *
 * `JSONSchemaToTs` still takes `unknown` and narrows at runtime, because a
 * schema value can also be a boolean (`true`/`false`) — and, in legacy
 * draft-07, an `items` array — which this object type intentionally doesn't
 * model. The function reads back through itself, so the recursion stays loose.
 */
export interface JSONSchema {
	$schema?:
		| "https://json-schema.org/draft/2020-12/schema"
		| "http://json-schema.org/draft-07/schema#";
	type?: JSONSchemaType | JSONSchemaType[];
	format?: string;
	pattern?: string;
	$ref?: string;
	items?: boolean | JSONSchema;
	prefixItems?: JSONSchema[];
	additionalItems?: boolean | JSONSchema;
	enum?: unknown[];
	minimum?: number;
	maximum?: number;
	exclusiveMinimum?: number;
	exclusiveMaximum?: number;
	minItems?: number;
	maxItems?: number;
	title?: string;
	description?: string;
	properties?: { [key: string]: JSONSchema };
	required?: string[];
	examples?: unknown[];
	not?: JSONSchema;
	// support both $defs and definitions
	$defs?: { [key: string]: JSONSchema };
	definitions?: { [key: string]: JSONSchema };
	additionalProperties?: boolean | JSONSchema;
	anyOf?: JSONSchema[];
	oneOf?: JSONSchema[];
	allOf?: JSONSchema[];
	// older schema
	const?: unknown;
	example?: unknown;
	// binary
	contentEncoding?: string;
	contentMediaType?: string;
	minLength?: number;
	maxLength?: number;
	// explicit TypeScript-type override for code generation
	"x-tsType"?: string;
}

/**
 * Convert a JSON Schema to a compact TypeScript type string for the prompt.
 *
 * Pass the whole schema document (with any `$defs` / `definitions`): local
 * `$ref`s resolve against it, and a recursive schema terminates — the cycle's
 * back-edge renders as `unknown` while everything above it stays fully typed.
 */
export function JSONSchemaToTs(jsonSchema: unknown): string {
	return toTs(jsonSchema, jsonSchema, new Set());
}

/**
 * Recursive worker. `root` is the document the first call was handed (the
 * resolution base for `$ref`); `seen` is the set of refs currently being
 * expanded on this path, so a cycle short-circuits to `unknown` instead of
 * recursing forever.
 */
function toTs(jsonSchema: unknown, root: unknown, seen: Set<string>): string {
	if (jsonSchema === true) return "unknown";
	if (jsonSchema === false) return "never";
	if (jsonSchema === null || jsonSchema === undefined) return "unknown";
	if (typeof jsonSchema !== "object") return "unknown";
	const schema = jsonSchema as JSONSchema;

	if (typeof schema.$ref === "string") {
		if (seen.has(schema.$ref)) return "unknown"; // cycle back-edge
		const target = resolveRef(schema.$ref, root);
		if (target === undefined) return "unknown";
		seen.add(schema.$ref);
		const resolved = toTs(target, root, seen);
		seen.delete(schema.$ref);
		return resolved;
	}

	if ("const" in schema) return JSON.stringify(schema.const);

	if (schema.enum) {
		return schema.enum.map((v) => JSON.stringify(v)).join(" | ") || "never";
	}

	if (schema.allOf) {
		const parts = schema.allOf.map((s) => toTs(s, root, seen));
		return parts.length ? `(${parts.join(" & ")})` : "unknown";
	}
	if (schema.anyOf) {
		const parts = schema.anyOf.map((s) => toTs(s, root, seen));
		return parts.length ? `(${parts.join(" | ")})` : "never";
	}
	if (schema.oneOf) {
		const parts = schema.oneOf.map((s) => toTs(s, root, seen));
		return parts.length ? `(${parts.join(" | ")})` : "never";
	}
	if (schema.not) return "unknown";

	if (Array.isArray(schema.type)) {
		const types = schema.type.map((t) =>
			toTs({ ...schema, type: t }, root, seen),
		);
		return types.length ? `(${types.join(" | ")})` : "unknown";
	}

	const type = schema.type;

	if (type === "string") return "string";
	if (type === "number" || type === "integer") return "number";
	if (type === "boolean") return "boolean";
	if (type === "null") return "null";

	if (
		type === "object" ||
		schema.properties ||
		schema.additionalProperties !== undefined
	) {
		const props = schema.properties || {};
		const required = schema.required || [];

		const propStrings = Object.entries(props).map(([key, value]) => {
			const isRequired = required.includes(key);
			const safeName = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)
				? key
				: JSON.stringify(key);
			return `${safeName}${isRequired ? "" : "?"}: ${toTs(value, root, seen)}`;
		});

		let additionalType: string | null = null;
		if (schema.additionalProperties === true) {
			additionalType = "unknown";
		} else if (
			schema.additionalProperties &&
			typeof schema.additionalProperties === "object"
		) {
			additionalType = toTs(schema.additionalProperties, root, seen);
		}

		if (propStrings.length === 0 && additionalType) {
			return `{ [key: string]: ${additionalType} }`;
		}
		if (propStrings.length === 0 && !additionalType) {
			return schema.additionalProperties === false
				? "{}"
				: "{ [key: string]: unknown }";
		}

		let result = `{ ${propStrings.join("; ")} }`;
		if (additionalType) {
			result = `(${result} & { [key: string]: ${additionalType} })`;
		}
		return result;
	}

	if (type === "array" || schema.items || schema.prefixItems) {
		if (schema.prefixItems) {
			const tupleTypes = schema.prefixItems.map((s) => toTs(s, root, seen));
			if (schema.items === false) return `[${tupleTypes.join(", ")}]`;
			const restType = schema.items ? toTs(schema.items, root, seen) : "unknown";
			return `[${tupleTypes.join(", ")}, ...${restType}[]]`;
		}

		if (schema.items !== undefined && schema.items !== null) {
			if (Array.isArray(schema.items)) {
				const tupleTypes = schema.items.map((s) => toTs(s, root, seen));
				if (schema.additionalItems === false) {
					return `[${tupleTypes.join(", ")}]`;
				}
				const restType = schema.additionalItems
					? toTs(schema.additionalItems, root, seen)
					: "unknown";
				return `[${tupleTypes.join(", ")}, ...${restType}[]]`;
			}
			return `${toTs(schema.items, root, seen)}[]`;
		}

		return "unknown[]";
	}

	if (schema.properties) {
		return toTs({ ...schema, type: "object" }, root, seen);
	}

	return "unknown";
}

/**
 * Resolve a local JSON Pointer ref (`#/$defs/Foo`, `#/definitions/Bar`)
 * against the document root. Returns the target sub-schema, or `undefined`
 * for a non-local ref (`https://…`, bare `#`) or a path that doesn't exist —
 * the caller renders those as `unknown`.
 */
function resolveRef(ref: string, root: unknown): unknown {
	if (!ref.startsWith("#/")) return undefined;
	const segments = ref
		.slice(2)
		.split("/")
		.map((seg) => seg.replace(/~1/g, "/").replace(/~0/g, "~"));
	let node: unknown = root;
	for (const seg of segments) {
		if (node === null || typeof node !== "object") return undefined;
		node = (node as Record<string, unknown>)[seg];
	}
	return node;
}
