import { describe, expect, it } from "vitest";
import type { Fired } from "../../types";
import { extractDeps } from "../extract-deps";

const element = (
  patch: Partial<Fired.Element>,
): Fired.Element => ({
  key: "x",
  component: "C",
  ...patch,
});

const list = (patch: Partial<Fired.List>): Fired.List => ({
  key: "x",
  component: "Row",
  as: "item",
  each: "scopes.root.rows",
  ...patch,
});

describe("extractDeps — reads from props.expr", () => {
  it("captures a simple scopes path", () => {
    expect(
      extractDeps(element({ props: { expr: "({ value: scopes.root.count })" } })),
    ).toEqual(["scopes.root.count"]);
  });

  it("captures multiple distinct paths", () => {
    const deps = extractDeps(
      element({
        props: { expr: "({ a: scopes.root.a, b: scopes.root.b })" },
      }),
    );
    expect(deps).toEqual(
      expect.arrayContaining(["scopes.root.a", "scopes.root.b"]),
    );
    expect(deps).toHaveLength(2);
  });

  it("captures paths inside conditional expressions", () => {
    expect(
      extractDeps(
        element({
          props: { expr: "scopes.root.flag ? scopes.root.a : scopes.root.b" },
        }),
      ),
    ).toEqual(
      expect.arrayContaining([
        "scopes.root.flag",
        "scopes.root.a",
        "scopes.root.b",
      ]),
    );
  });

  it("captures paths inside arrow callbacks (e.g. .filter)", () => {
    const deps = extractDeps(
      element({
        props: {
          expr: "({ items: scopes.inv.rows.filter(r => r.match === scopes.root.searchTerm) })",
        },
      }),
    );
    expect(deps).toEqual(
      expect.arrayContaining([
        "scopes.inv.rows",
        "scopes.root.searchTerm",
      ]),
    );
  });
});

describe("extractDeps — method-call segments are dropped", () => {
  it("drops the final segment when the chain is a CallExpression callee", () => {
    expect(
      extractDeps(
        element({ props: { expr: "scopes.root.items.filter(x => x)" } }),
      ),
    ).toEqual(["scopes.root.items"]);
    expect(
      extractDeps(
        element({ props: { expr: "scopes.root.items.map(x => x)" } }),
      ),
    ).toEqual(["scopes.root.items"]);
  });

  it("records the full static chain for non-call property access", () => {
    // `.length` is a property read, not a method call — the chain is
    // recorded verbatim. Writers should set the parent path
    // (`scopes.root.items`) when they want length-readers to wake.
    expect(
      extractDeps(
        element({ props: { expr: "scopes.root.items.length" } }),
      ),
    ).toEqual(["scopes.root.items.length"]);
  });
});

describe("extractDeps — computed access handling", () => {
  it("stops at computed key and records the parent path", () => {
    const deps = extractDeps(
      element({ props: { expr: "scopes.root.rows[0].name" } }),
    );
    // `scopes.root.rows[0].name` — the computed `[0]` stops the static chain
    // at `scopes.root.rows`. `.name` past the dynamic step isn't reachable.
    expect(deps).toContain("scopes.root.rows");
  });

  it("walks computed-key sub-expressions for further scopes reads", () => {
    const deps = extractDeps(
      element({
        props: { expr: "scopes.root.a[scopes.root.idx]" },
      }),
    );
    expect(deps).toEqual(
      expect.arrayContaining(["scopes.root.a", "scopes.root.idx"]),
    );
  });
});

describe("extractDeps — what is NOT scanned", () => {
  it("does not read defaults", () => {
    expect(
      extractDeps(
        element({
          defaults: [{ set: "scopes.root.count", expr: "scopes.root.seed" }],
        }),
      ),
    ).toEqual([]);
  });

  it("does not read callbacks", () => {
    expect(
      extractDeps(
        element({
          callbacks: {
            onClick: [
              { set: "scopes.root.count", expr: "scopes.root.count + 1" },
            ],
          },
        }),
      ),
    ).toEqual([]);
  });

  it("excludes evt.X reads (evt is callback-only and not a scope)", () => {
    expect(
      extractDeps(element({ props: { expr: "evt.value" } })),
    ).toEqual([]);
  });
});

describe("extractDeps — list chunks read each too", () => {
  it("captures each", () => {
    expect(extractDeps(list({ each: "scopes.root.rows" }))).toEqual([
      "scopes.root.rows",
    ]);
  });

  it("captures both each and props.expr reads on a list", () => {
    const deps = extractDeps(
      list({
        each: "scopes.root.rows",
        props: { expr: "({ title: scopes.root.heading })" },
      }),
    );
    expect(deps).toEqual(
      expect.arrayContaining(["scopes.root.rows", "scopes.root.heading"]),
    );
  });
});

describe("extractDeps — caching and purity", () => {
  it("returns the same array reference for the same chunk", () => {
    const c = element({ props: { expr: "scopes.root.count" } });
    expect(extractDeps(c)).toBe(extractDeps(c));
  });

  it("ignores stray top-level deps fields (deps is no longer accepted)", () => {
    // Belt-and-suspenders guard: if someone hand-writes a chunk that
    // carries a legacy `deps: [...]` field, it MUST be ignored by the
    // extractor — auto-detection is the only source of truth.
    const c = element({ props: { expr: "scopes.root.real" } }) as unknown as
      Fired.Element & { deps: string[] };
    c.deps = ["scopes.root.LEGACY_SHOULD_NOT_LEAK"];
    expect(extractDeps(c)).toEqual(["scopes.root.real"]);
  });
});
