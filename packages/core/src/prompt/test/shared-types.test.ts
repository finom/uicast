import { describe, expect, it } from "vitest";
import { jsonSchemaToTs } from "../json-schema-to-ts";
import { collectSharedTypes } from "../shared-types";

const person = {
  type: "object",
  properties: { id: { type: "string" }, name: { type: "string" } },
  required: ["id"],
} as const;

describe("collectSharedTypes", () => {
  it("names a definition and references it instead of inlining", () => {
    const doc = {
      type: "object",
      properties: {
        owner: { $ref: "#/$defs/Person" },
        reviewer: { $ref: "#/$defs/Person" },
      },
      $defs: { Person: person },
    };
    const shared = collectSharedTypes();
    const refs = shared.add(doc);

    expect(jsonSchemaToTs(doc, { namedRefs: refs })).toBe("{ owner?: Person; reviewer?: Person }");
    expect(shared.lines()).toEqual(["- Person: { id: string; name?: string }"]);
  });

  it("states a recursive definition, which inlining cannot", () => {
    const node = {
      type: "object",
      properties: {
        name: { type: "string" },
        children: { type: "array", items: { $ref: "#/$defs/Node" } },
      },
    };
    const doc = {
      type: "object",
      properties: { root: { $ref: "#/$defs/Node" } },
      $defs: { Node: node },
    };

    expect(jsonSchemaToTs(doc)).toBe("{ root?: { name?: string; children?: unknown[] } }");

    const shared = collectSharedTypes();
    const refs = shared.add(doc);
    expect(jsonSchemaToTs(doc, { namedRefs: refs })).toBe("{ root?: Node }");
    expect(shared.lines()).toEqual(["- Node: { name?: string; children?: Node[] }"]);
  });

  it("prints the same type once across documents", () => {
    const shared = collectSharedTypes();
    const a = shared.add({
      type: "object",
      properties: { a: { $ref: "#/$defs/Person" } },
      $defs: { Person: person },
    });
    const b = shared.add({
      type: "object",
      properties: { b: { $ref: "#/$defs/Person" } },
      $defs: { Person: person },
    });

    expect(a["#/$defs/Person"]).toBe("Person");
    expect(b["#/$defs/Person"]).toBe("Person");
    expect(shared.lines()).toHaveLength(1);
  });

  it("disambiguates two different types sharing a name", () => {
    const shared = collectSharedTypes();
    shared.add({ $defs: { Person: person } });
    const second = shared.add({
      $defs: { Person: { type: "object", properties: { ref: { type: "number" } } } },
    });

    expect(second["#/$defs/Person"]).toBe("Person2");
    expect(shared.lines()).toEqual(["- Person: { id: string; name?: string }", "- Person2: { ref?: number }"]);
  });

  it("reads the draft-07 `definitions` spelling too", () => {
    const shared = collectSharedTypes();
    const refs = shared.add({
      type: "object",
      properties: { who: { $ref: "#/definitions/Person" } },
      definitions: { Person: person },
    });

    expect(refs["#/definitions/Person"]).toBe("Person");
    expect(shared.lines()).toEqual(["- Person: { id: string; name?: string }"]);
  });

  it("carries a definition's own description onto its line", () => {
    const shared = collectSharedTypes();
    shared.add({
      $defs: { Person: { ...person, description: "Someone with an account." } },
    });

    expect(shared.lines()).toEqual(["- Person: { id: string; name?: string } — Someone with an account."]);
  });

  it("hoists a self-referential root ref, keeping the recursion expressible", () => {
    const shared = collectSharedTypes();
    const doc = {
      $ref: "#/$defs/Node",
      $defs: {
        Node: {
          type: "object",
          properties: {
            children: { type: "array", items: { $ref: "#/$defs/Node" } },
          },
        },
      },
    };
    const refs = shared.add(doc);

    expect(refs["#/$defs/Node"]).toBe("Node");
    expect(shared.lines()).toEqual(["- Node: { children?: Node[] }"]);
    expect(jsonSchemaToTs(doc, { namedRefs: refs })).toBe("Node");
  });

  it("does not dedupe textually identical defs whose refs resolve differently", () => {
    const shared = collectSharedTypes();
    const list = { type: "array", items: { $ref: "#/$defs/Item" } };
    const refsA = shared.add({
      $defs: { Item: { type: "string" }, List: list },
    });
    const refsB = shared.add({
      $defs: { Item: { type: "number" }, List: list },
    });

    expect(refsA["#/$defs/List"]).toBe("List");
    expect(refsB["#/$defs/List"]).toBe("List2");
    expect(shared.lines()).toEqual(["- Item: string", "- List: Item[]", "- Item2: number", "- List2: Item2[]"]);
  });

  it("leaves a document that is only a self-ref alone", () => {
    const shared = collectSharedTypes();
    const doc = { $ref: "#/$defs/Wrapper", $defs: { Wrapper: person } };
    const refs = shared.add(doc);

    expect(refs).toEqual({});
    expect(shared.lines()).toEqual([]);
    expect(jsonSchemaToTs(doc, { namedRefs: refs })).toBe("{ id: string; name?: string }");
  });

  it("sanitizes a name that would not survive as a bare type", () => {
    const shared = collectSharedTypes();
    const refs = shared.add({ $defs: { "user-record": person } });

    expect(refs["#/$defs/user-record"]).toBe("userrecord");
  });

  it("returns nothing for a schema with no definitions", () => {
    const shared = collectSharedTypes();

    expect(shared.add(person)).toEqual({});
    expect(shared.add(null)).toEqual({});
    expect(shared.lines()).toEqual([]);
  });
});
