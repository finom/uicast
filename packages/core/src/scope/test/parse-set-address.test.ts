import { describe, expect, it } from "vitest";
import { entrySetAddressError, findSetAddressFault, parseSetAddress, setAddressError } from "../parse-set-address";

describe("findSetAddressFault", () => {
  it("accepts scopes.<scope>.<field>", () => {
    expect(findSetAddressFault("scopes.root.count")).toBeNull();
    expect(findSetAddressFault("scopes.row.qty")).toBeNull();
    expect(findSetAddressFault("scopes.root.$draft")).toBeNull();
    expect(findSetAddressFault("scopes.root._private")).toBeNull();
  });

  it("refuses anything deeper, shallower, numeric or unprefixed", () => {
    for (const address of [
      "scopes.root.user.name",
      "scopes.row.item.qty",
      "scopes.root.rows.0",
      "scopes.root",
      "root.count",
      "scopes.root.0",
      "scopes..x",
      "",
    ]) {
      expect(findSetAddressFault(address), address).toEqual({ kind: "shape" });
    }
  });

  it("refuses the runtime's row fields", () => {
    for (const field of ["$$id", "$$index", "$$value"]) {
      expect(findSetAddressFault(`scopes.row.${field}`)).toEqual({ kind: "reserved", segment: field });
    }
  });

  it("refuses prototype keys in either segment", () => {
    expect(findSetAddressFault("scopes.root.__proto__")).toEqual({
      kind: "prototype",
      segment: "__proto__",
    });
    expect(findSetAddressFault("scopes.constructor.x")).toEqual({
      kind: "prototype",
      segment: "constructor",
    });
  });
});

describe("parseSetAddress", () => {
  it("splits a valid address", () => {
    expect(parseSetAddress("scopes.order.status")).toEqual({ scope: "order", field: "status" });
  });

  it("throws a classified guardrail-violation naming the element", () => {
    expect(() => parseSetAddress("scopes.root.a.b", "card")).toThrow(
      expect.objectContaining({ reason: "guardrail-violation", elementKey: "card" }),
    );
  });
});

describe("setAddressError", () => {
  it("names the fix for each fault", () => {
    expect(setAddressError("scopes.root.a.b", { kind: "shape" }).message).toContain("write the whole field");
    expect(setAddressError("scopes.row.$$id", { kind: "reserved", segment: "$$id" }).message).toContain("read-only");
    expect(setAddressError("scopes.root.__proto__", { kind: "prototype", segment: "__proto__" }).message).toContain(
      "prototype chain",
    );
  });
});

describe("entrySetAddressError", () => {
  it("scans seed and every callback, skipping effect-only steps", () => {
    const error = entrySetAddressError({
      key: "card",
      seed: [{ set: "scopes.root.a", literal: 1 }],
      callbacks: {
        onClick: [{ expr: "save()" }, { set: "scopes.root.rows.0", literal: 1 }],
      },
    });
    expect(error).toMatchObject({ reason: "guardrail-violation", elementKey: "card" });
    expect(error?.message).toContain('"scopes.root.rows.0" is not an address');
    expect(entrySetAddressError({ key: "card", seed: [{ set: "scopes.root.a", literal: 1 }] })).toBeNull();
  });
});
