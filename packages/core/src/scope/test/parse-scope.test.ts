import { describe, expect, it } from "vitest";
import { depKey, parseScope } from "../parse-scope";

describe("parseScope", () => {
  it("splits a top-level scoped key", () => {
    expect(parseScope("scopes.root.count")).toEqual(["root", "count"]);
  });

  it("preserves dotted leaf paths", () => {
    expect(parseScope("scopes.root.user.name")).toEqual(["root", "user.name"]);
  });

  it("keeps the whole-scope marker as the leaf", () => {
    expect(parseScope("scopes.root.*")).toEqual(["root", "*"]);
  });
});

describe("depKey", () => {
  it("keeps the scope and the first field", () => {
    expect(depKey("scopes.root.user.name")).toBe("scopes.root.user");
    expect(depKey("scopes.root.count")).toBe("scopes.root.count");
  });

  it("is every field of a bare scope", () => {
    expect(depKey("scopes.root")).toBe("scopes.root.*");
  });
});
