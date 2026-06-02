import { describe, expect, it } from "vitest";
import { parseScope } from "../parseScope";

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

  it("strips a custom prefix passed as the 2nd argument", () => {
    expect(parseScope("state.root.count", "state")).toEqual(["root", "count"]);
  });

  it("leaves the key untouched when it doesn't start with the custom prefix", () => {
    // "scopes" is not the active prefix here, so it's treated as the scope name.
    expect(parseScope("scopes.root.count", "state")).toEqual([
      "scopes",
      "root.count",
    ]);
  });
});
