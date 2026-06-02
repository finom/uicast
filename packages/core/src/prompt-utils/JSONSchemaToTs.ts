/**
 * Minimal JSON Schema shape used by the renderer. Covers the subset this
 * module reads — primitives, composition keywords (allOf/anyOf/oneOf/not),
 * objects (properties / required / additionalProperties), and arrays
 * (items / prefixItems / additionalItems). `unknown` everywhere a value
 * may be another schema, so the recursion stays loose: every site reads
 * back through `JSONSchemaToTs(...)` which validates shape inline.
 */
export interface JSONSchema {
	type?:
		| "string"
		| "number"
		| "integer"
		| "boolean"
		| "null"
		| "object"
		| "array"
		| Array<
				| "string"
				| "number"
				| "integer"
				| "boolean"
				| "null"
				| "object"
				| "array"
		  >;
	const?: unknown;
	enum?: unknown[];
	allOf?: unknown[];
	anyOf?: unknown[];
	oneOf?: unknown[];
	not?: unknown;
	properties?: Record<string, unknown>;
	required?: string[];
	additionalProperties?: boolean | unknown;
	items?: boolean | unknown | unknown[];
	prefixItems?: unknown[];
	additionalItems?: boolean | unknown;
}

export function JSONSchemaToTs(jsonSchema: unknown): string {
	if (jsonSchema === true) return "unknown";
	if (jsonSchema === false) return "never";
	if (jsonSchema === null || jsonSchema === undefined) return "unknown";
	if (typeof jsonSchema !== "object") return "unknown";
	const schema = jsonSchema as JSONSchema;

	if ("const" in schema) return JSON.stringify(schema.const);

	if (schema.enum) {
		return schema.enum.map((v) => JSON.stringify(v)).join(" | ") || "never";
	}

	if (schema.allOf) {
		const parts = schema.allOf.map((s) => JSONSchemaToTs(s));
		return parts.length ? `(${parts.join(" & ")})` : "unknown";
	}
	if (schema.anyOf) {
		const parts = schema.anyOf.map((s) => JSONSchemaToTs(s));
		return parts.length ? `(${parts.join(" | ")})` : "never";
	}
	if (schema.oneOf) {
		const parts = schema.oneOf.map((s) => JSONSchemaToTs(s));
		return parts.length ? `(${parts.join(" | ")})` : "never";
	}
	if (schema.not) return "unknown";

	if (Array.isArray(schema.type)) {
		const types = schema.type.map((t) =>
			JSONSchemaToTs({ ...schema, type: t }),
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
			return `${safeName}${isRequired ? "" : "?"}: ${JSONSchemaToTs(value)}`;
		});

		let additionalType: string | null = null;
		if (schema.additionalProperties === true) {
			additionalType = "unknown";
		} else if (
			schema.additionalProperties &&
			typeof schema.additionalProperties === "object"
		) {
			additionalType = JSONSchemaToTs(schema.additionalProperties);
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
			const tupleTypes = schema.prefixItems.map((s) => JSONSchemaToTs(s));
			if (schema.items === false) return `[${tupleTypes.join(", ")}]`;
			const restType = schema.items ? JSONSchemaToTs(schema.items) : "unknown";
			return `[${tupleTypes.join(", ")}, ...${restType}[]]`;
		}

		if (schema.items !== undefined && schema.items !== null) {
			if (Array.isArray(schema.items)) {
				const tupleTypes = schema.items.map((s) => JSONSchemaToTs(s));
				if (schema.additionalItems === false) {
					return `[${tupleTypes.join(", ")}]`;
				}
				const restType = schema.additionalItems
					? JSONSchemaToTs(schema.additionalItems)
					: "unknown";
				return `[${tupleTypes.join(", ")}, ...${restType}[]]`;
			}
			return `${JSONSchemaToTs(schema.items)}[]`;
		}

		return "unknown[]";
	}

	if (schema.properties) {
		return JSONSchemaToTs({ ...schema, type: "object" });
	}

	return "unknown";
}
