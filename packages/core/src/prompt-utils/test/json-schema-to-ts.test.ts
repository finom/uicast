import { describe, expect, it } from "vitest";
import { JSONSchemaToTs } from "../json-schema-to-ts";

describe("JSONSchemaToTs — primitives", () => {
	it("renders primitive types", () => {
		expect(JSONSchemaToTs({ type: "string" })).toBe("string");
		expect(JSONSchemaToTs({ type: "number" })).toBe("number");
		expect(JSONSchemaToTs({ type: "integer" })).toBe("number");
		expect(JSONSchemaToTs({ type: "boolean" })).toBe("boolean");
		expect(JSONSchemaToTs({ type: "null" })).toBe("null");
	});

	it("returns 'unknown' / 'never' for boolean schemas", () => {
		expect(JSONSchemaToTs(true)).toBe("unknown");
		expect(JSONSchemaToTs(false)).toBe("never");
	});

	it("falls back to 'unknown' for null / undefined / non-object input", () => {
		expect(JSONSchemaToTs(null)).toBe("unknown");
		expect(JSONSchemaToTs(undefined)).toBe("unknown");
		expect(JSONSchemaToTs("not a schema")).toBe("unknown");
	});
});

describe("JSONSchemaToTs — composition", () => {
	it("renders const as a literal", () => {
		expect(JSONSchemaToTs({ const: 42 })).toBe("42");
		expect(JSONSchemaToTs({ const: "hello" })).toBe('"hello"');
	});

	it("renders enum as a union of literals", () => {
		expect(JSONSchemaToTs({ enum: ["a", "b"] })).toBe('"a" | "b"');
		expect(JSONSchemaToTs({ enum: [1, 2, 3] })).toBe("1 | 2 | 3");
	});

	it("renders allOf as intersection", () => {
		expect(
			JSONSchemaToTs({
				allOf: [{ type: "string" }, { type: "number" }],
			}),
		).toBe("(string & number)");
	});

	it("renders anyOf / oneOf as union", () => {
		expect(
			JSONSchemaToTs({
				anyOf: [{ type: "string" }, { type: "number" }],
			}),
		).toBe("(string | number)");
		expect(
			JSONSchemaToTs({
				oneOf: [{ type: "string" }, { type: "null" }],
			}),
		).toBe("(string | null)");
	});

	it("renders array-type as union of types", () => {
		expect(JSONSchemaToTs({ type: ["string", "null"] })).toBe(
			"(string | null)",
		);
	});
});

describe("JSONSchemaToTs — objects", () => {
	it("renders required vs optional properties", () => {
		expect(
			JSONSchemaToTs({
				type: "object",
				properties: { a: { type: "string" }, b: { type: "number" } },
				required: ["a"],
			}),
		).toBe("{ a: string; b?: number }");
	});

	it("renders additionalProperties true / false / schema", () => {
		expect(
			JSONSchemaToTs({
				type: "object",
				properties: {},
				additionalProperties: true,
			}),
		).toBe("{ [key: string]: unknown }");

		expect(
			JSONSchemaToTs({
				type: "object",
				properties: {},
				additionalProperties: false,
			}),
		).toBe("{}");

		expect(
			JSONSchemaToTs({
				type: "object",
				properties: { id: { type: "string" } },
				required: ["id"],
				additionalProperties: { type: "number" },
			}),
		).toBe("({ id: string } & { [key: string]: number })");
	});

	it("quotes property names that aren't valid identifiers", () => {
		expect(
			JSONSchemaToTs({
				type: "object",
				properties: { "weird-key": { type: "string" } },
				required: ["weird-key"],
			}),
		).toBe('{ "weird-key": string }');
	});
});

describe("JSONSchemaToTs — arrays", () => {
	it("renders typed arrays", () => {
		expect(JSONSchemaToTs({ type: "array", items: { type: "number" } })).toBe(
			"number[]",
		);
	});

	it("renders prefixItems tuples", () => {
		expect(
			JSONSchemaToTs({
				prefixItems: [{ type: "string" }, { type: "number" }],
				items: false,
			}),
		).toBe("[string, number]");
	});

	it("renders prefixItems with rest tail", () => {
		expect(
			JSONSchemaToTs({
				prefixItems: [{ type: "string" }],
				items: { type: "number" },
			}),
		).toBe("[string, ...number[]]");
	});

	it("falls back to unknown[] when items missing", () => {
		expect(JSONSchemaToTs({ type: "array" })).toBe("unknown[]");
	});
});
