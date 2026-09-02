import { describe, expect, it } from "vitest";
import { depKey, parseScope } from "../parse-scope";

describe("parseScope", () => {
  it("splits a top-level scoped key", () => {
    expect(parseScope("scopes.root.count")).toEqual(["root", "count"]);
  });

  it("preserves dotted leaf paths", () => {
    expect(parseScope("scopes.root.user.name")).toEqual(["root", "user.name"]);
  });

  it("accepts keys without the 'scopes.' prefix", () => {
    expect(parseScope("root.count")).toEqual(["root", "count"]);
  });

  it("throws when no scope/leaf separator is present", () => {
    expect(() => parseScope("noDots")).toThrow(/Invalid scope key/);
  });

  it("throws on a bare scope name with no leaf path", () => {
    // "scopes.root" normalizes to just "root" — a whole-scope read, not a path
    // into one. useReactiveDeps deliberately catches this throw for such reads.
    expect(() => parseScope("scopes.root")).toThrow(/Invalid scope key/);
  });
});

describe("depKey", () => {
  it("keeps the scope and the first field", () => {
    expect(depKey("scopes.root.user.name")).toBe("scopes.root.user");
    expect(depKey("scopes.root.count")).toBe("scopes.root.count");
    expect(depKey("root.count")).toBe("scopes.root.count");
  });

  it("is null for a bare scope", () => {
    expect(depKey("scopes.root")).toBeNull();
    expect(depKey("scopes.root.")).toBeNull();
  });
});
