import { describe, expect, it } from "vitest";
import { createProxyScope } from "@uicast/core";
import { readScopePath } from "./read-scope-path";

describe("readScopePath", () => {
  it("reads a top-level key", () => {
    expect(readScopePath({ count: 5 }, "count")).toBe(5);
  });

  it("reads a nested dotted path", () => {
    expect(readScopePath({ user: { name: "ada" } }, "user.name")).toBe("ada");
  });

  it("short-circuits a missing segment to undefined instead of throwing", () => {
    expect(readScopePath({}, "a.b.c")).toBeUndefined();
    expect(readScopePath({ a: null }, "a.b")).toBeUndefined();
  });

  it("returns undefined when the scope itself is nullish", () => {
    expect(readScopePath(undefined, "x")).toBeUndefined();
    expect(readScopePath(null, "x.y")).toBeUndefined();
  });

  it("reads through a reactive proxy the way an expression would", () => {
    const scope = createProxyScope({ items: [1, 2], open: true });
    expect(readScopePath(scope, "items")).toEqual([1, 2]);
    expect(readScopePath(scope, "open")).toBe(true);
    expect(readScopePath(scope, "missing")).toBeUndefined();
  });
});
