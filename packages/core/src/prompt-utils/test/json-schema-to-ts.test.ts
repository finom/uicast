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

	it("renders boolean `items: true` as unknown[]", () => {
		expect(JSONSchemaToTs({ type: "array", items: true })).toBe("unknown[]");
	});

	it("renders legacy draft-07 tuple `items` arrays", () => {
		expect(
			JSONSchemaToTs({
				items: [{ type: "string" }, { type: "number" }],
				additionalItems: false,
			}),
		).toBe("[string, number]");
		expect(
			JSONSchemaToTs({
				items: [{ type: "string" }],
				additionalItems: { type: "number" },
			}),
		).toBe("[string, ...number[]]");
	});
});

describe("JSONSchemaToTs — type unions & nesting", () => {
	it("renders a type-array that includes a structured type", () => {
		expect(
			JSONSchemaToTs({ type: ["string", "array"], items: { type: "number" } }),
		).toBe("(string | number[])");
	});

	it("recurses into nested object properties", () => {
		expect(
			JSONSchemaToTs({
				type: "object",
				properties: {
					a: {
						type: "object",
						properties: { b: { type: "number" } },
						required: ["b"],
					},
				},
				required: ["a"],
			}),
		).toBe("{ a: { b: number } }");
	});

	it("renders an index signature for additionalProperties without properties", () => {
		expect(
			JSONSchemaToTs({
				type: "object",
				additionalProperties: { type: "number" },
			}),
		).toBe("{ [key: string]: number }");
	});

	it("ignores refinement keywords that don't change the TS type", () => {
		expect(
			JSONSchemaToTs({
				type: "string",
				format: "email",
				pattern: "^x",
				minLength: 3,
				maxLength: 9,
			}),
		).toBe("string");
	});
});

describe("JSONSchemaToTs — lossy / unhandled (documented limits)", () => {
	it("renders `not` as unknown (no negation type in TS)", () => {
		expect(JSONSchemaToTs({ not: { type: "string" } })).toBe("unknown");
	});

	it("renders an empty schema as unknown", () => {
		expect(JSONSchemaToTs({})).toBe("unknown");
	});
});

describe("JSONSchemaToTs — $ref resolution", () => {
	it("resolves a $ref against the document's $defs", () => {
		expect(
			JSONSchemaToTs({
				type: "object",
				properties: { user: { $ref: "#/$defs/User" } },
				required: ["user"],
				$defs: {
					User: {
						type: "object",
						properties: { id: { type: "string" } },
						required: ["id"],
					},
				},
			}),
		).toBe("{ user: { id: string } }");
	});

	it("resolves draft-07 `definitions` refs too", () => {
		expect(
			JSONSchemaToTs({
				$ref: "#/definitions/S",
				definitions: { S: { type: "string" } },
			}),
		).toBe("string");
	});

	it("expands a shared $ref fully in every position (not a false cycle)", () => {
		expect(
			JSONSchemaToTs({
				type: "object",
				properties: { a: { $ref: "#/$defs/P" }, b: { $ref: "#/$defs/P" } },
				required: ["a", "b"],
				$defs: {
					P: {
						type: "object",
						properties: { x: { type: "number" } },
						required: ["x"],
					},
				},
			}),
		).toBe("{ a: { x: number }; b: { x: number } }");
	});

	it("terminates a recursive schema at the cycle back-edge", () => {
		// The recursive `children` back-edge becomes `unknown[]`; everything
		// above it stays fully typed. (This is the shape Zod v4 emits for a
		// `z.lazy` recursive schema — $defs + self-$ref.)
		expect(
			JSONSchemaToTs({
				type: "object",
				properties: { root: { $ref: "#/$defs/Node" } },
				required: ["root"],
				$defs: {
					Node: {
						type: "object",
						properties: {
							label: { type: "string" },
							children: { type: "array", items: { $ref: "#/$defs/Node" } },
						},
						required: ["label"],
					},
				},
			}),
		).toBe("{ root: { label: string; children?: unknown[] } }");
	});

	it("renders an unresolvable / non-local $ref as unknown", () => {
		// Missing target.
		expect(JSONSchemaToTs({ $ref: "#/$defs/Missing" })).toBe("unknown");
		// Remote ref — no document loader, so it can't be resolved.
		expect(JSONSchemaToTs({ $ref: "https://example.com/s.json" })).toBe(
			"unknown",
		);
	});
});

describe("JSONSchemaToTs — descriptions", () => {
	it("annotates described fields inline and leaves undescribed fields bare", () => {
		expect(
			JSONSchemaToTs({
				type: "object",
				properties: {
					qty: { type: "integer", description: "Quantity ordered." },
					note: { type: "string" },
				},
				required: ["qty"],
			}),
		).toBe("{ qty: number /* Quantity ordered. */; note?: string }");
	});

	it("annotates nested objects on both the field and its members", () => {
		expect(
			JSONSchemaToTs({
				type: "object",
				properties: {
					address: {
						type: "object",
						description: "Shipping address.",
						properties: {
							city: { type: "string", description: "City name." },
							zip: { type: "string" },
						},
						required: ["city"],
					},
				},
			}),
		).toBe(
			"{ address?: { city: string /* City name. */; zip?: string } /* Shipping address. */ }",
		);
	});

	it("annotates enums and array items", () => {
		expect(
			JSONSchemaToTs({
				type: "object",
				properties: {
					status: {
						enum: ["pending", "paid"],
						description: "Order status.",
					},
					tags: {
						type: "array",
						description: "Labels attached to the order.",
						items: { type: "string" },
					},
				},
			}),
		).toBe(
			'{ status?: "pending" | "paid" /* Order status. */; tags?: string[] /* Labels attached to the order. */ }',
		);
	});

	it("annotates a nullable (multi-type) field once, not per variant", () => {
		expect(
			JSONSchemaToTs({
				type: "object",
				properties: {
					icon: {
						type: ["string", "null"],
						description: "Emoji icon.",
					},
				},
			}),
		).toBe("{ icon?: (string | null) /* Emoji icon. */ }");
	});

	it("annotates const values and tuple members", () => {
		expect(
			JSONSchemaToTs({
				type: "object",
				properties: {
					kind: { const: "order", description: "Discriminator." },
					pair: {
						type: "array",
						items: [
							{ type: "number", description: "Latitude." },
							{ type: "number", description: "Longitude." },
						],
						additionalItems: false,
					},
				},
			}),
		).toBe(
			'{ kind?: "order" /* Discriminator. */; pair?: [number /* Latitude. */, number /* Longitude. */] }',
		);
	});

	it("parenthesizes an array whose ITEM type ends in an annotation", () => {
		expect(
			JSONSchemaToTs({
				type: "array",
				items: { type: "string", description: "A tag." },
			}),
		).toBe("(string /* A tag. */)[]");
		// A comment inside braces needs no parens.
		expect(
			JSONSchemaToTs({
				type: "array",
				items: {
					type: "object",
					properties: { id: { type: "number", description: "Row id." } },
				},
			}),
		).toBe("{ id?: number /* Row id. */ }[]");
	});

	it("annotates an additionalProperties value schema", () => {
		expect(
			JSONSchemaToTs({
				type: "object",
				additionalProperties: { type: "number", description: "Score 0-1." },
			}),
		).toBe("{ [key: string]: number /* Score 0-1. */ }");
	});

	it("prefers the $ref site description over the target's, without doubling", () => {
		const root = {
			type: "object",
			properties: {
				home: { $ref: "#/$defs/Address", description: "Home address." },
				work: { $ref: "#/$defs/Address" },
			},
			$defs: {
				Address: {
					type: "object",
					description: "A postal address.",
					properties: { city: { type: "string", description: "City name." } },
				},
			},
		};
		expect(JSONSchemaToTs(root)).toBe(
			"{ home?: { city?: string /* City name. */ } /* Home address. */; work?: { city?: string /* City name. */ } /* A postal address. */ }",
		);
	});

	it("annotates anyOf branches and the union itself independently", () => {
		expect(
			JSONSchemaToTs({
				description: "Payment target.",
				anyOf: [
					{ type: "string", description: "IBAN." },
					{ type: "number", description: "Legacy account number." },
				],
			}),
		).toBe(
			"(string /* IBAN. */ | number /* Legacy account number. */) /* Payment target. */",
		);
	});

	it("multiline mode indents by depth and follows $refs", () => {
		expect(
			JSONSchemaToTs(
				{
					type: "object",
					properties: {
						home: { $ref: "#/$defs/Address", description: "Home address." },
					},
					required: ["home"],
					$defs: {
						Address: {
							type: "object",
							properties: {
								city: { type: "string", description: "City name." },
							},
							required: ["city"],
						},
					},
				},
				{ multiline: "  " },
			),
		).toBe(
			[
				"{",
				"    home: {",
				"      city: string /* City name. */;",
				"    } /* Home address. */;",
				"  }",
			].join("\n"),
		);
	});

	it("skips empty and whitespace-only descriptions", () => {
		expect(JSONSchemaToTs({ type: "string", description: "" })).toBe("string");
		expect(JSONSchemaToTs({ type: "string", description: "   " })).toBe(
			"string",
		);
	});

	it("flattens newlines and defuses */ inside a description", () => {
		expect(
			JSONSchemaToTs({
				type: "string",
				description: "Line one\n  line two */ tail",
			}),
		).toBe("string /* Line one line two * tail */");
	});
});
