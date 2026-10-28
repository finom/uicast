import { type StandardToolV0, standardTool } from "standard-tool";
import { describe, expect, expectTypeOf, it } from "vitest";
import { z } from "zod";
import { exprTool } from "../expr-tool";

const validate = (value: unknown, read = true) => exprTool({ read }).inputSchema["~standard"].validate(value);
const validateOutput = (value: unknown, read = true) => exprTool({ read }).outputSchema["~standard"].validate(value);
const messages = (result: unknown) =>
  (result as { issues?: { message: string; path?: PropertyKey[] }[] }).issues?.map(({ message, path }) =>
    [path?.join("."), message].filter(Boolean).join(": "),
  );

describe("exprTool", () => {
  it("is a StandardToolV0", () => {
    expectTypeOf(exprTool()).toExtend<StandardToolV0>();
  });

  it("names the tool and fills the read limit", () => {
    const tool = exprTool({ read: true });
    expect(tool.name).toBe("expr");
    expect(tool.description).toContain("8000 characters");
    expect(tool.description).not.toContain("🔴");
  });

  it("appends the note", () => {
    expect(exprTool({ note: "Selection lives in scopes.root.selected." }).description).toMatch(
      /## Note\n\nSelection lives in scopes\.root\.selected\.$/,
    );
  });

  it("accepts steps, a read, or both", async () => {
    for (const input of [
      { steps: [{ set: "scopes.root.selected", literal: { a: true } }] },
      { read: "scopes.root.rows.length" },
      { steps: [{ expr: "download({ rows: [] })", confirm: "Download?" }], read: "1" },
    ]) {
      expect(await validate(input)).toEqual({ value: input });
    }
  });

  it("refuses an input with nothing to do or a bad field, naming it", async () => {
    expect(messages(await validate({}))).toEqual(['Give "steps", "read" or both.']);
    expect(messages(await validate({ read: 1 }))).toEqual(["read: Expected a string"]);
    expect(messages(await validate({ steps: [{ set: "scopes.root.x", expr: "1", debounce: true }] }))).toEqual([
      'steps.0: Unknown key "debounce"',
    ]);
    expect(messages(await validate("x"))).toEqual(["Expected an object"]);
    expect(messages(await validate([]))).toEqual(["Expected an object"]);
    expect(messages(await validate({ read: "1", write: "2" }))).toEqual(['Unknown key "write"']);
    expect(messages(await validate({ steps: "x" }))).toEqual(["steps: Expected an array"]);
    expect(messages(await validate({ steps: [null, { expr: "1", literal: 1 }, { set: "scopes.root.x" }] }))).toEqual([
      "steps.0: Expected an object",
      'steps.1: Give either "expr" or "literal"',
      'steps.2: Give either "expr" or "literal"',
    ]);
    expect(messages(await validate({ steps: [{ set: 1, confirm: false, expr: null }] }))).toEqual([
      "steps.0.set: Expected a string",
      "steps.0.confirm: Expected a string",
      "steps.0.expr: Expected a string",
    ]);
  });

  it("takes a literal of any JSON value, null included", async () => {
    const input = { steps: [{ set: "scopes.root.x", literal: null }] };
    expect(await validate(input)).toEqual({ value: input });
  });

  it("checks its answers", async () => {
    for (const output of [
      {},
      { value: [1] },
      { declined: true },
      { error: { reason: "unknown-reference", message: "m" } },
    ]) {
      expect(await validateOutput(output)).toEqual({ value: output });
    }
    for (const output of [
      null,
      { declined: false },
      { error: { reason: "nope", message: "m" } },
      { error: { reason: "unknown", message: 1 } },
      { error: { reason: "unknown", message: "m", stack: "s" } },
      { value: 1, extra: 2 },
    ]) {
      expect(await validateOutput(output)).toHaveProperty("issues");
    }
  });

  it("gives JSON Schemas with the field descriptions", () => {
    const { inputSchema, outputSchema } = exprTool({ read: true });
    const input = inputSchema["~standard"].jsonSchema.input({ target: "draft-07" });
    expect(input).toMatchObject({
      type: "object",
      properties: { steps: { type: "array" }, read: { type: "string", description: expect.any(String) } },
      additionalProperties: false,
    });
    expect(JSON.stringify(input)).toContain("scopes.root.<field> to write");
    expect(outputSchema["~standard"].jsonSchema.output({ target: "draft-2020-12" })).toHaveProperty("anyOf");
  });

  it("gives the same JSON Schema to every draft it supports, and refuses others", () => {
    const { inputSchema } = exprTool();
    const draft07 = inputSchema["~standard"].jsonSchema.input({ target: "draft-07" });
    expect(inputSchema["~standard"].jsonSchema.input({ target: "openapi-3.0" })).toEqual(draft07);
    expect(() => inputSchema["~standard"].jsonSchema.input({ target: "draft-04" as "draft-07" })).toThrow(/draft-04/);
  });

  it("hands out a copy of its JSON Schema", () => {
    const { inputSchema } = exprTool({ read: true });
    const first = inputSchema["~standard"].jsonSchema.input({ target: "draft-07" });
    first.properties = {};
    expect(inputSchema["~standard"].jsonSchema.input({ target: "draft-07" })).toHaveProperty("properties.read");
  });

  it("leaves the functions to the system prompt when given none", () => {
    expect(exprTool().description).not.toContain("## Functions");
  });

  it("describes the functions it is given, in place of the system prompt's", () => {
    const getCustomer = standardTool({
      name: "getCustomer",
      description: "One customer.",
      inputSchema: z.object({ id: z.number() }),
      execute: () => null,
    });
    expect(exprTool({ functions: [getCustomer] }).description).toContain(
      "## Functions: only these, not the ones in system prompt\n\ngetCustomer\n\n### Function Details\n\n" +
        "- getCustomer({\n    id: number;\n  }) => unknown: One customer.",
    );
    expect(exprTool({ read: true, functions: [] }).description).toContain(
      "## Functions\n\nNone: a step or `read` that calls one fails.",
    );
    expect(() => exprTool({ functions: [getCustomer, getCustomer] })).toThrow(/Duplicate host function name/);
  });

  describe("without read (the default)", () => {
    it("says no value comes back, and never offers read", () => {
      const { description } = exprTool();
      expect(description).toContain("No value comes back to you");
      expect(description).not.toMatch(/`read`|"value"|characters/);
      expect(exprTool({ functions: [] }).description).toContain("None: a step that calls one fails.");
    });

    it("has no read in its JSON Schemas", () => {
      const { inputSchema, outputSchema } = exprTool();
      expect(inputSchema["~standard"].jsonSchema.input({ target: "draft-07" })).toEqual({
        type: "object",
        properties: { steps: expect.objectContaining({ type: "array" }) },
        required: ["steps"],
        additionalProperties: false,
      });
      expect(JSON.stringify(outputSchema["~standard"].jsonSchema.output({ target: "draft-07" }))).not.toContain(
        "value",
      );
    });

    it("takes steps and refuses a read, saying it is off", async () => {
      const steps = [{ set: "scopes.root.selected", literal: { a: true } }];
      expect(await validate({ steps }, false)).toEqual({ value: { steps } });
      expect(messages(await validate({ steps, read: "1" }, false))).toEqual([
        "read: Off: this tool sends no value back",
      ]);
      expect(messages(await validate({ read: "1" }, false))).toEqual([
        "read: Off: this tool sends no value back",
        'Give "steps".',
      ]);
      expect(messages(await validate({ steps, write: 1 }, false))).toEqual(['Unknown key "write"']);
      expect(messages(await validate({ steps: "x" }, false))).toEqual(["steps: Expected an array"]);
    });

    it("answers no value", async () => {
      for (const output of [{}, { declined: true }, { error: { reason: "unknown", message: "m" } }]) {
        expect(await validateOutput(output, false)).toEqual({ value: output });
      }
      expect(await validateOutput({ value: 1 }, false)).toHaveProperty("issues");
    });
  });

  it("refuses to run outside the browser", () => {
    expect(() => exprTool().execute({})).toThrow(/useExprTool\(\)/);
  });
});
