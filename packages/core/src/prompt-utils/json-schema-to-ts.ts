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

export type JSONSchemaToTsOptions = {
	/**
	 * Render objects one property per line, indented. The string is the prefix
	 * every generated line starts with (the caller's continuation indent, e.g.
	 * `"  "` inside a Markdown bullet); nesting adds two spaces per level.
	 * Omit for the compact single-line form.
	 */
	multiline?: string;
};

/**
 * Convert a JSON Schema to a compact TypeScript type string for the prompt.
 *
 * Pass the whole schema document (with any `$defs` / `definitions`): local
 * `$ref`s resolve against it, and a recursive schema terminates — the cycle's
 * back-edge renders as `unknown` while everything above it stays fully typed.
 */
export function JSONSchemaToTs(
	jsonSchema: unknown,
	options?: JSONSchemaToTsOptions,
): string {
	const ml =
		options?.multiline !== undefined
			? { pad: options.multiline, depth: 0 }
			: null;
	return toTs(jsonSchema, jsonSchema, new Set(), ml);
}

/** Multiline state: the caller's line prefix + current nesting depth. */
type Multiline = { pad: string; depth: number } | null;

/**
 * Recursive worker. Renders the node's type, then — when the node carries a
 * `description` — appends it as a trailing ` /* … *​/` comment, so per-field
 * docs (Zod `.describe()` / `.meta({ description })`) survive into the prompt
 * at every nesting level. Nodes without a description add nothing.
 */
function toTs(
	jsonSchema: unknown,
	root: unknown,
	seen: Set<string>,
	ml: Multiline = null,
): string {
	const base = toTsBase(jsonSchema, root, seen, ml);
	if (
		jsonSchema !== null &&
		typeof jsonSchema === "object" &&
		typeof (jsonSchema as JSONSchema).description === "string"
	) {
		// One line, and never a premature close: `*/` inside a description
		// would truncate the comment (and the type after it).
		const description = (jsonSchema as JSONSchema).description
			?.replace(/\s+/g, " ")
			.replace(/\*\//g, "*")
			.trim();
		if (description) return `${base} /* ${description} */`;
	}
	return base;
}

/**
 * Type rendering without the description pass. `root` is the document the
 * first call was handed (the resolution base for `$ref`); `seen` is the set of
 * refs currently being expanded on this path, so a cycle short-circuits to
 * `unknown` instead of recursing forever.
 */
function toTsBase(
	jsonSchema: unknown,
	root: unknown,
	seen: Set<string>,
	ml: Multiline,
): string {
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
		// When the referencing node has its own description, it wins (it names
		// the field's role at THIS use site) — render the target without its
		// root annotation so the field isn't double-commented. The target's
		// nested fields keep their own annotations either way.
		const resolved =
			typeof schema.description === "string"
				? toTsBase(target, root, seen, ml)
				: toTs(target, root, seen, ml);
		seen.delete(schema.$ref);
		return resolved;
	}

	if ("const" in schema) return JSON.stringify(schema.const);

	if (schema.enum) {
		return schema.enum.map((v) => JSON.stringify(v)).join(" | ") || "never";
	}

	if (schema.allOf) {
		const parts = schema.allOf.map((s) => toTs(s, root, seen, ml));
		return parts.length ? `(${parts.join(" & ")})` : "unknown";
	}
	if (schema.anyOf) {
		const parts = schema.anyOf.map((s) => toTs(s, root, seen, ml));
		return parts.length ? `(${parts.join(" | ")})` : "never";
	}
	if (schema.oneOf) {
		const parts = schema.oneOf.map((s) => toTs(s, root, seen, ml));
		return parts.length ? `(${parts.join(" | ")})` : "never";
	}
	if (schema.not) return "unknown";

	if (Array.isArray(schema.type)) {
		// Drop the description on the per-type variants — the wrapper already
		// annotates the union as a whole; keeping it would stamp every member.
		const types = schema.type.map((t) =>
			toTs({ ...schema, type: t, description: undefined }, root, seen, ml),
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

		const childMl = ml ? { pad: ml.pad, depth: ml.depth + 1 } : null;
		const propStrings = Object.entries(props).map(([key, value]) => {
			const isRequired = required.includes(key);
			const safeName = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)
				? key
				: JSON.stringify(key);
			return `${safeName}${isRequired ? "" : "?"}: ${toTs(value, root, seen, childMl)}`;
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

		let result: string;
		if (ml) {
			// One property per line: fields one level deeper than this object's
			// braces, the closing brace back at the object's own level.
			const inner = ml.pad + "  ".repeat(ml.depth + 1);
			const closing = ml.pad + "  ".repeat(ml.depth);
			result = `{\n${inner}${propStrings.join(`;\n${inner}`)};\n${closing}}`;
		} else {
			result = `{ ${propStrings.join("; ")} }`;
		}
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
			const itemTs = toTs(schema.items, root, seen, ml);
			// An item type ENDING in an annotation must be parenthesized —
			// `string /* x */[]` reads as if the comment interrupts the type;
			// `(string /* x */)[]` keeps the array suffix unambiguous. A comment
			// safely inside braces (`{ a: string /* x */ }[]`) needs nothing.
			return itemTs.endsWith("*/") ? `(${itemTs})[]` : `${itemTs}[]`;
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
