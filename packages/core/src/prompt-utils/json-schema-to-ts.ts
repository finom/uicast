type JSONSchemaType =
	| "object"
	| "array"
	| "string"
	| "number"
	| "boolean"
	| "null"
	| "integer";

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

type JSONSchemaToTsOptions = {
	// The caller's continuation indent; omit for the single-line form.
	multiline?: string;
	// `{ "#/$defs/Person": "Person" }`: what makes a recursive schema expressible.
	namedRefs?: Record<string, string>;
};

// Pass the whole document so `$ref`s resolve; a cycle renders `unknown` unless the ref is in `namedRefs`.
export function jsonSchemaToTs(
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

type Multiline = { pad: string; depth: number } | null;

type Ctx = {
	root: unknown;
	seen: Set<string>;
	named: Record<string, string> | null;
};

function toTs(
	jsonSchema: unknown,
	ctx: Ctx,
	ml: Multiline = null,
): string {
	const base = toTsBase(jsonSchema, ctx, ml);
	const note = annotation(jsonSchema);
	return note ? `${base} /* ${note} */` : base;
}

// One line; a `*/` inside would end the comment early, so it is neutered.
function annotation(jsonSchema: unknown): string {
	if (jsonSchema === null || typeof jsonSchema !== "object") return "";
	const schema = jsonSchema as JSONSchema;
	const description =
		typeof schema.description === "string"
			? schema.description.replace(/\s+/g, " ").trim()
			: "";
	return [description, constraints(schema).join(", ")]
		.filter(Boolean)
		.join(" ")
		.replace(/\*\//g, "*");
}

// A bare `.int()` stamps ±MAX_SAFE_INTEGER, which is no constraint.
function constraints(schema: JSONSchema): string[] {
	const out: string[] = [];
	const types = Array.isArray(schema.type) ? schema.type : [schema.type];
	if (types.includes("integer")) out.push("integer");
	if (schema.minimum !== undefined && schema.minimum !== -Number.MAX_SAFE_INTEGER) {
		out.push(`≥ ${schema.minimum}`);
	}
	if (schema.maximum !== undefined && schema.maximum !== Number.MAX_SAFE_INTEGER) {
		out.push(`≤ ${schema.maximum}`);
	}
	if (schema.exclusiveMinimum !== undefined) out.push(`> ${schema.exclusiveMinimum}`);
	if (schema.exclusiveMaximum !== undefined) out.push(`< ${schema.exclusiveMaximum}`);
	if (schema.multipleOf !== undefined) out.push(`multiple of ${schema.multipleOf}`);
	if (schema.minLength !== undefined) out.push(`length ≥ ${schema.minLength}`);
	if (schema.maxLength !== undefined) out.push(`length ≤ ${schema.maxLength}`);
	// A format comes with a generated pattern; the name says it better.
	if (schema.format) out.push(`format ${schema.format}`);
	else if (schema.pattern) out.push(`pattern ${schema.pattern}`);
	if (schema.minItems !== undefined) out.push(`items ≥ ${schema.minItems}`);
	if (schema.maxItems !== undefined) out.push(`items ≤ ${schema.maxItems}`);
	if (schema.uniqueItems) out.push("unique items");
	if (schema.default !== undefined) out.push(`default ${JSON.stringify(schema.default)}`);
	return out;
}

function toTsBase(
	jsonSchema: unknown,
	ctx: Ctx,
	ml: Multiline,
): string {
	if (jsonSchema === true) return "unknown";
	if (jsonSchema === false) return "never";
	if (jsonSchema === null || typeof jsonSchema !== "object") return "unknown";
	const schema = jsonSchema as JSONSchema;

	if (typeof schema.$ref === "string") {
		// Before the cycle guard: a recursive type is exactly the case a name is for.
		const named = ctx.named?.[schema.$ref];
		if (named) return named;
		if (ctx.seen.has(schema.$ref)) return "unknown";
		const target = resolveRef(schema.$ref, ctx.root);
		if (target === undefined) return "unknown";
		ctx.seen.add(schema.$ref);
		// The referencing node's own annotation wins, so the target renders without its root annotation.
		const resolved = annotation(schema)
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
		// The wrapper annotates the union as a whole.
		const types = schema.type.map((t) => toTsBase({ ...schema, type: t }, ctx, ml));
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
		// Single-line even in multiline mode: it sits inside an index-signature wrapper.
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

function renderArray(schema: JSONSchema, ctx: Ctx, ml: Multiline): string {
	// Single-line even in multiline mode: a tuple reads as one row.
	if (schema.prefixItems) {
		const tupleTypes = schema.prefixItems.map((s) => toTs(s, ctx));
		if (schema.items === false) return `[${tupleTypes.join(", ")}]`;
		const restType = schema.items ? toTs(schema.items, ctx) : "unknown";
		return `[${tupleTypes.join(", ")}, ...${restType}[]]`;
	}

	if (schema.items === undefined) return "unknown[]";
	const itemTs = toTs(schema.items, ctx, ml);
	// `string /* x */[]` reads as if the comment interrupts the type; parenthesized it does not.
	return itemTs.endsWith("*/") ? `(${itemTs})[]` : `${itemTs}[]`;
}

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
