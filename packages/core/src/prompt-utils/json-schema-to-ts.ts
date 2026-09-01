type JSONSchemaType =
	| "object"
	| "array"
	| "string"
	| "number"
	| "boolean"
	| "null"
	| "integer";

/** The draft-07/2020-12 keywords a Standard-Schema `toJSONSchema()` emits. Callers still narrow from `unknown` — a schema value can also be a boolean. */
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
	$id?: string;
	title?: string;
	description?: string;
	properties?: { [key: string]: JSONSchema };
	required?: string[];
	examples?: unknown[];
	not?: JSONSchema;
	$defs?: { [key: string]: JSONSchema };
	definitions?: { [key: string]: JSONSchema };
	additionalProperties?: boolean | JSONSchema;
	anyOf?: JSONSchema[];
	oneOf?: JSONSchema[];
	allOf?: JSONSchema[];
	const?: unknown;
	example?: unknown;
	// binary
	contentEncoding?: string;
	contentMediaType?: string;
	minLength?: number;
	maxLength?: number;
}

export type JSONSchemaToTsOptions = {
	/** Render objects one property per line; the string is the caller's continuation indent. Omit for the single-line form. */
	multiline?: string;
	/** Pointers rendered as a NAME instead of their expansion (`{ "#/$defs/Person": "Person" }`) — what makes a recursive schema expressible. */
	namedRefs?: Record<string, string>;
};

/**
 * JSON Schema → compact TypeScript type string. Pass the whole document so
 * `$ref`s resolve; recursion terminates (`unknown` at the back-edge) unless
 * the ref is named via `namedRefs`.
 */
export function JSONSchemaToTs(
	jsonSchema: unknown,
	options?: JSONSchemaToTsOptions,
): string {
	const ml =
		options?.multiline !== undefined
			? { pad: options.multiline, depth: 0 }
			: null;
	return toTs(
		jsonSchema,
		{ root: jsonSchema, seen: new Set(), named: options?.namedRefs ?? null },
		ml,
	);
}

/** Multiline state: the caller's line prefix + current nesting depth. */
type Multiline = { pad: string; depth: number } | null;

/** Recursion state: the ref-resolution root, the in-flight refs (cycle guard), the pointer→name map. */
type Ctx = {
	root: unknown;
	seen: Set<string>;
	named: Record<string, string> | null;
};

/** Recursive worker; a node's `description` renders as a trailing comment at every nesting level. */
function toTs(
	jsonSchema: unknown,
	ctx: Ctx,
	ml: Multiline = null,
): string {
	const base = toTsBase(jsonSchema, ctx, ml);
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

/** Type rendering without the description pass (see `Ctx` for what travels). */
function toTsBase(
	jsonSchema: unknown,
	ctx: Ctx,
	ml: Multiline,
): string {
	if (jsonSchema === true) return "unknown";
	if (jsonSchema === false) return "never";
	if (jsonSchema === null || jsonSchema === undefined) return "unknown";
	if (typeof jsonSchema !== "object") return "unknown";
	const schema = jsonSchema as JSONSchema;

	if (typeof schema.$ref === "string") {
		// A hoisted definition renders as its name. This has to come before the
		// cycle guard: a recursive type is exactly the case where inlining gives
		// up and returns `unknown`, and a name is what lets it be stated.
		const named = ctx.named?.[schema.$ref];
		if (named) return named;
		if (ctx.seen.has(schema.$ref)) return "unknown"; // cycle back-edge
		const target = resolveRef(schema.$ref, ctx.root);
		if (target === undefined) return "unknown";
		ctx.seen.add(schema.$ref);
		// When the referencing node has its own description, it wins (it names
		// the field's role at THIS use site) — render the target without its
		// root annotation so the field isn't double-commented. The target's
		// nested fields keep their own annotations either way.
		const resolved =
			typeof schema.description === "string"
				? toTsBase(target, ctx, ml)
				: toTs(target, ctx, ml);
		ctx.seen.delete(schema.$ref);
		return resolved;
	}

	if ("const" in schema) return JSON.stringify(schema.const);

	if (schema.enum) {
		return schema.enum.map((v) => JSON.stringify(v)).join(" | ") || "never";
	}

	if (schema.allOf) {
		const parts = schema.allOf.map((s) => toTs(s, ctx, ml));
		return parts.length ? `(${parts.join(" & ")})` : "unknown";
	}
	if (schema.anyOf) {
		const parts = schema.anyOf.map((s) => toTs(s, ctx, ml));
		return parts.length ? `(${parts.join(" | ")})` : "never";
	}
	if (schema.oneOf) {
		const parts = schema.oneOf.map((s) => toTs(s, ctx, ml));
		return parts.length ? `(${parts.join(" | ")})` : "never";
	}
	if (schema.not) return "unknown";

	if (Array.isArray(schema.type)) {
		// Drop the description on the per-type variants — the wrapper already
		// annotates the union as a whole; keeping it would stamp every member.
		const types = schema.type.map((t) =>
			toTs({ ...schema, type: t, description: undefined }, ctx, ml),
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
		return renderObject(schema, ctx, ml);
	}

	if (type === "array" || schema.items || schema.prefixItems) {
		return renderArray(schema, ctx, ml);
	}

	return "unknown";
}

/** The object branch of `toTsBase`: properties, index signatures, layout. */
function renderObject(schema: JSONSchema, ctx: Ctx, ml: Multiline): string {
	const props = schema.properties || {};
	const required = schema.required || [];

	const childMl = ml ? { pad: ml.pad, depth: ml.depth + 1 } : null;
	const propStrings = Object.entries(props).map(([key, value]) => {
		const isRequired = required.includes(key);
		const safeName = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)
			? key
			: JSON.stringify(key);
		return `${safeName}${isRequired ? "" : "?"}: ${toTs(value, ctx, childMl)}`;
	});

	let additionalType: string | null = null;
	if (schema.additionalProperties === true) {
		additionalType = "unknown";
	} else if (
		schema.additionalProperties &&
		typeof schema.additionalProperties === "object"
	) {
		// Deliberately single-line even in multiline mode: the value type sits
		// inside an index-signature wrapper, where one line reads best.
		additionalType = toTs(schema.additionalProperties, ctx);
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

/** The array branch of `toTsBase`: tuples (both drafts) and plain item arrays. */
function renderArray(schema: JSONSchema, ctx: Ctx, ml: Multiline): string {
	// Tuple members are deliberately single-line even in multiline mode —
	// a tuple reads as one bracketed row.
	if (schema.prefixItems) {
		const tupleTypes = schema.prefixItems.map((s) => toTs(s, ctx));
		if (schema.items === false) return `[${tupleTypes.join(", ")}]`;
		const restType = schema.items ? toTs(schema.items, ctx) : "unknown";
		return `[${tupleTypes.join(", ")}, ...${restType}[]]`;
	}

	if (schema.items !== undefined && schema.items !== null) {
		if (Array.isArray(schema.items)) {
			const tupleTypes = schema.items.map((s) => toTs(s, ctx));
			if (schema.additionalItems === false) {
				return `[${tupleTypes.join(", ")}]`;
			}
			const restType = schema.additionalItems
				? toTs(schema.additionalItems, ctx)
				: "unknown";
			return `[${tupleTypes.join(", ")}, ...${restType}[]]`;
		}
		const itemTs = toTs(schema.items, ctx, ml);
		// An item type ENDING in an annotation must be parenthesized —
		// `string /* x */[]` reads as if the comment interrupts the type;
		// `(string /* x */)[]` keeps the array suffix unambiguous. A comment
		// safely inside braces (`{ a: string /* x */ }[]`) needs nothing.
		return itemTs.endsWith("*/") ? `(${itemTs})[]` : `${itemTs}[]`;
	}

	return "unknown[]";
}

/** Resolve a local pointer ref against the root; `undefined` for non-local or missing (rendered as `unknown`). */
export function resolveRef(ref: string, root: unknown): unknown {
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
