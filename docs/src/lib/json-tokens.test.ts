import { describe, expect, it } from "vitest";
import { tokenizeExpression } from "./json-tokens";

describe("tokenizeExpression", () => {
  it("splits an expression into kinds and keeps every character", () => {
    const source = "({ text: scopes.root.items.filter((i) => i.done).length + ' left', n: 2, ok: true, f: getX() })";
    const tokens = tokenizeExpression(source);
    expect(tokens.map((t) => t.text).join("")).toBe(source);
    const kinds = Object.fromEntries(tokens.filter((t) => t.kind !== "punct").map((t) => [t.text, t.kind]));
    expect(kinds).toMatchObject({
      text: "ident",
      scopes: "scope",
      filter: "fn",
      "=>": "kw",
      "' left'": "str",
      "2": "num",
      true: "kw",
      getX: "fn",
    });
  });
});
