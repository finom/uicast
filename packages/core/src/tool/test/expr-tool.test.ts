import type { StandardToolV0 } from "standard-tool";
import { describe, expect, expectTypeOf, it } from "vitest";
import { exprTool } from "../expr-tool";

const validate = (value: unknown) => exprTool().inputSchema["~standard"].validate(value);
const validateOutput = (value: unknown) => exprTool().outputSchema["~standard"].validate(value);
const messages = (result: unknown) =>
  (result as { issues?: { message: string; path?: PropertyKey[] }[] }).issues?.map(({ message, path }) =>
    [path?.join("."), message].filter(Boolean).join(": "),
  );

describe("exprTool", () => {
  it("is a StandardToolV0", () => {
    expectTypeOf(exprTool()).toExtend<StandardToolV0>();
  });

  it("names the tool and fills the read limit", () => {
    const tool = exprTool();
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
    expect(messages(await validate({ read: 1 }))).toEqual(["read: Invalid input: expected string, received number"]);
    expect(messages(await validate({ steps: [{ set: "scopes.root.x", expr: "1", debounce: true }] }))).toEqual([
      'steps.0: Unrecognized key: "debounce"',
    ]);
    expect(messages(await validate("x"))).toEqual(["Invalid input: expected object, received string"]);
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
    for (const output of [{ declined: false }, { error: { reason: "nope", message: "m" } }, { value: 1, extra: 2 }]) {
      expect(await validateOutput(output)).toHaveProperty("issues");
    }
  });

  it("gives JSON Schemas with the field descriptions", () => {
    const { inputSchema, outputSchema } = exprTool();
    const input = inputSchema["~standard"].jsonSchema.input({ target: "draft-07" });
    expect(input).toMatchObject({
      type: "object",
      properties: { steps: { type: "array" }, read: { type: "string", description: expect.any(String) } },
      additionalProperties: false,
    });
    expect(JSON.stringify(input)).toContain("scopes.root.<field> to write");
    expect(outputSchema["~standard"].jsonSchema.output({ target: "draft-2020-12" })).toHaveProperty("anyOf");
  });

  it("refuses to run outside the browser", () => {
    expect(() => exprTool().execute({})).toThrow(/useExprTool\(\)/);
  });
});
