import { describe, expect, it } from "vitest";
import { jsonSchemaToTs } from "../json-schema-to-ts";

describe("jsonSchemaToTs — primitives", () => {
  it("renders primitive types", () => {
    expect(jsonSchemaToTs({ type: "string" })).toBe("string");
    expect(jsonSchemaToTs({ type: "number" })).toBe("number");
    expect(jsonSchemaToTs({ type: "integer" })).toBe("number /* integer */");
    expect(jsonSchemaToTs({ type: "boolean" })).toBe("boolean");
    expect(jsonSchemaToTs({ type: "null" })).toBe("null");
  });

  it("returns 'unknown' / 'never' for boolean schemas", () => {
    expect(jsonSchemaToTs(true)).toBe("unknown");
    expect(jsonSchemaToTs(false)).toBe("never");
  });

  it("falls back to 'unknown' for null / undefined / non-object input", () => {
    expect(jsonSchemaToTs(null)).toBe("unknown");
    expect(jsonSchemaToTs(undefined)).toBe("unknown");
    expect(jsonSchemaToTs("not a schema")).toBe("unknown");
  });
});

describe("jsonSchemaToTs — composition", () => {
  it("renders const as a literal", () => {
    expect(jsonSchemaToTs({ const: 42 })).toBe("42");
    expect(jsonSchemaToTs({ const: "hello" })).toBe('"hello"');
  });

  it("renders enum as a union of literals", () => {
    expect(jsonSchemaToTs({ enum: ["a", "b"] })).toBe('"a" | "b"');
    expect(jsonSchemaToTs({ enum: [1, 2, 3] })).toBe("1 | 2 | 3");
  });

  it("renders allOf as intersection", () => {
    expect(
      jsonSchemaToTs({
        allOf: [{ type: "string" }, { type: "number" }],
      }),
    ).toBe("(string & number)");
  });

  it("renders anyOf / oneOf as union", () => {
    expect(
      jsonSchemaToTs({
        anyOf: [{ type: "string" }, { type: "number" }],
      }),
    ).toBe("(string | number)");
    expect(
      jsonSchemaToTs({
        oneOf: [{ type: "string" }, { type: "null" }],
      }),
    ).toBe("(string | null)");
  });

  it("renders array-type as union of types", () => {
    expect(jsonSchemaToTs({ type: ["string", "null"] })).toBe("(string | null)");
  });
});

describe("jsonSchemaToTs — objects", () => {
  it("renders required vs optional properties", () => {
    expect(
      jsonSchemaToTs({
        type: "object",
        properties: { a: { type: "string" }, b: { type: "number" } },
        required: ["a"],
      }),
    ).toBe("{ a: string; b?: number }");
  });

  it("renders additionalProperties true / false / schema", () => {
    expect(
      jsonSchemaToTs({
        type: "object",
        properties: {},
        additionalProperties: true,
      }),
    ).toBe("{ [key: string]: unknown }");

    expect(
      jsonSchemaToTs({
        type: "object",
        properties: {},
        additionalProperties: false,
      }),
    ).toBe("{}");

    expect(
      jsonSchemaToTs({
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
        additionalProperties: { type: "number" },
      }),
    ).toBe("({ id: string } & { [key: string]: number })");
  });

  it("quotes property names that aren't valid identifiers", () => {
    expect(
      jsonSchemaToTs({
        type: "object",
        properties: { "weird-key": { type: "string" } },
        required: ["weird-key"],
      }),
    ).toBe('{ "weird-key": string }');
  });
});

describe("jsonSchemaToTs — arrays", () => {
  it("renders typed arrays", () => {
    expect(jsonSchemaToTs({ type: "array", items: { type: "number" } })).toBe("number[]");
  });

  it("renders prefixItems tuples", () => {
    expect(
      jsonSchemaToTs({
        prefixItems: [{ type: "string" }, { type: "number" }],
        items: false,
      }),
    ).toBe("[string, number]");
  });

  it("renders prefixItems with rest tail", () => {
    expect(
      jsonSchemaToTs({
        prefixItems: [{ type: "string" }],
        items: { type: "number" },
      }),
    ).toBe("[string, ...number[]]");
  });

  it("falls back to unknown[] when items missing", () => {
    expect(jsonSchemaToTs({ type: "array" })).toBe("unknown[]");
  });

  it("renders boolean `items: true` as unknown[]", () => {
    expect(jsonSchemaToTs({ type: "array", items: true })).toBe("unknown[]");
  });
});

describe("jsonSchemaToTs — type unions & nesting", () => {
  it("renders a type-array that includes a structured type", () => {
    expect(jsonSchemaToTs({ type: ["string", "array"], items: { type: "number" } })).toBe("(string | number[])");
  });

  it("recurses into nested object properties", () => {
    expect(
      jsonSchemaToTs({
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
      jsonSchemaToTs({
        type: "object",
        additionalProperties: { type: "number" },
      }),
    ).toBe("{ [key: string]: number }");
  });
});

describe("jsonSchemaToTs — constraints", () => {
  it("renders what the type alone does not say, format over its generated pattern", () => {
    expect(
      jsonSchemaToTs({
        type: "string",
        format: "email",
        pattern: "^x",
        minLength: 3,
        maxLength: 9,
      }),
    ).toBe("string /* length ≥ 3, length ≤ 9, format email */");
    expect(jsonSchemaToTs({ type: "string", pattern: "^SKU-" })).toBe("string /* pattern ^SKU- */");
  });

  it("renders bounds and the default after the description", () => {
    expect(
      jsonSchemaToTs({
        type: "integer",
        minimum: 1,
        maximum: 200,
        default: 50,
        description: "Rows to return.",
      }),
    ).toBe("number /* Rows to return. integer, ≥ 1, ≤ 200, default 50 */");
    expect(jsonSchemaToTs({ type: "number", exclusiveMinimum: 0, multipleOf: 5 })).toBe(
      "number /* > 0, multiple of 5 */",
    );
    expect(
      jsonSchemaToTs({
        type: "array",
        items: { type: "string" },
        minItems: 1,
        maxItems: 5,
        uniqueItems: true,
      }),
    ).toBe("string[] /* items ≥ 1, items ≤ 5, unique items */");
  });

  it("drops the safe-integer bounds a bare `.int()` stamps", () => {
    expect(
      jsonSchemaToTs({
        type: "integer",
        minimum: -Number.MAX_SAFE_INTEGER,
        maximum: Number.MAX_SAFE_INTEGER,
      }),
    ).toBe("number /* integer */");
    expect(jsonSchemaToTs({ type: "integer", minimum: 0, maximum: Number.MAX_SAFE_INTEGER })).toBe(
      "number /* integer, ≥ 0 */",
    );
  });

  it("annotates a type union once, on the wrapper", () => {
    expect(jsonSchemaToTs({ type: ["integer", "null"], minimum: 1 })).toBe("(number | null) /* integer, ≥ 1 */");
  });
});

describe("jsonSchemaToTs — lossy / unhandled (documented limits)", () => {
  it("renders `not` as unknown (no negation type in TS)", () => {
    expect(jsonSchemaToTs({ not: { type: "string" } })).toBe("unknown");
  });

  it("renders an empty schema as unknown", () => {
    expect(jsonSchemaToTs({})).toBe("unknown");
  });
});

describe("jsonSchemaToTs — $ref resolution", () => {
  it("resolves a $ref against the document's $defs", () => {
    expect(
      jsonSchemaToTs({
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
      jsonSchemaToTs({
        $ref: "#/definitions/S",
        definitions: { S: { type: "string" } },
      }),
    ).toBe("string");
  });

  it("expands a shared $ref fully in every position (not a false cycle)", () => {
    expect(
      jsonSchemaToTs({
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
    expect(
      jsonSchemaToTs({
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

  it("resolves `#` to the document root, once", () => {
    expect(
      jsonSchemaToTs({
        type: "object",
        properties: { name: { type: "string" }, kids: { type: "array", items: { $ref: "#" } } },
      }),
    ).toBe("{ name?: string; kids?: { name?: string; kids?: unknown[] }[] }");
  });

  it("renders an unresolvable / non-local $ref as unknown", () => {
    expect(jsonSchemaToTs({ $ref: "#/$defs/Missing" })).toBe("unknown");
    expect(jsonSchemaToTs({ $ref: "https://example.com/s.json" })).toBe("unknown");
  });
});

describe("jsonSchemaToTs — descriptions", () => {
  it("annotates described fields inline and leaves undescribed fields bare", () => {
    expect(
      jsonSchemaToTs({
        type: "object",
        properties: {
          qty: { type: "integer", description: "Quantity ordered." },
          note: { type: "string" },
        },
        required: ["qty"],
      }),
    ).toBe("{ qty: number /* Quantity ordered. integer */; note?: string }");
  });

  it("annotates nested objects on both the field and its members", () => {
    expect(
      jsonSchemaToTs({
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
    ).toBe("{ address?: { city: string /* City name. */; zip?: string } /* Shipping address. */ }");
  });

  it("annotates enums and array items", () => {
    expect(
      jsonSchemaToTs({
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
    ).toBe('{ status?: "pending" | "paid" /* Order status. */; tags?: string[] /* Labels attached to the order. */ }');
  });

  it("annotates a nullable (multi-type) field once, not per variant", () => {
    expect(
      jsonSchemaToTs({
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
      jsonSchemaToTs({
        type: "object",
        properties: {
          kind: { const: "order", description: "Discriminator." },
          pair: {
            type: "array",
            prefixItems: [
              { type: "number", description: "Latitude." },
              { type: "number", description: "Longitude." },
            ],
            items: false,
          },
        },
      }),
    ).toBe('{ kind?: "order" /* Discriminator. */; pair?: [number /* Latitude. */, number /* Longitude. */] }');
  });

  it("parenthesizes an array whose ITEM type ends in an annotation", () => {
    expect(
      jsonSchemaToTs({
        type: "array",
        items: { type: "string", description: "A tag." },
      }),
    ).toBe("(string /* A tag. */)[]");
    expect(
      jsonSchemaToTs({
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
      jsonSchemaToTs({
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
    expect(jsonSchemaToTs(root)).toBe(
      "{ home?: { city?: string /* City name. */ } /* Home address. */; work?: { city?: string /* City name. */ } /* A postal address. */ }",
    );
  });

  it("annotates anyOf branches and the union itself independently", () => {
    expect(
      jsonSchemaToTs({
        description: "Payment target.",
        anyOf: [
          { type: "string", description: "IBAN." },
          { type: "number", description: "Legacy account number." },
        ],
      }),
    ).toBe("(string /* IBAN. */ | number /* Legacy account number. */) /* Payment target. */");
  });

  it("multiline mode indents by depth and follows $refs", () => {
    expect(
      jsonSchemaToTs(
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
      ["{", "    home: {", "      city: string /* City name. */;", "    } /* Home address. */;", "  }"].join("\n"),
    );
  });

  it("skips empty and whitespace-only descriptions", () => {
    expect(jsonSchemaToTs({ type: "string", description: "" })).toBe("string");
    expect(jsonSchemaToTs({ type: "string", description: "   " })).toBe("string");
  });

  it("flattens newlines and defuses */ inside a description", () => {
    expect(
      jsonSchemaToTs({
        type: "string",
        description: "Line one\n  line two */ tail",
      }),
    ).toBe("string /* Line one line two * tail */");
  });
});
