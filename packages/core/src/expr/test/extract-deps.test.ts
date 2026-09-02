import { describe, expect, it } from "vitest";
import type { ComponentEntry, ComponentListEntry } from "../../types";
import { Evaluator } from "@uicast/expr";
import { type DepsPart, extractDeps as extract } from "../extract-deps";

const ev = new Evaluator();
const extractDeps = (entry: ComponentEntry, part?: DepsPart) => extract(entry, ev, part);

const element = (
  patch: Partial<ComponentEntry>,
): ComponentEntry => ({
  key: "x",
  component: "C",
  ...patch,
});

const list = (patch: Partial<ComponentListEntry>): ComponentListEntry => ({
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
  it("does not read seed", () => {
    expect(
      extractDeps(
        element({
          seed: [{ set: "scopes.root.count", expr: "scopes.root.seed" }],
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

describe("extractDeps — list entries read each too", () => {
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

describe("extractDeps — hidden contributes reads", () => {
  it("captures the hidden expression's paths", () => {
    expect(extractDeps(element({ hidden: "scopes.root.done" }))).toEqual([
      "scopes.root.done",
    ]);
  });

  it("unions hidden and props reads", () => {
    const deps = extractDeps(
      element({
        hidden: "scopes.root.done",
        props: { expr: "({ value: scopes.root.count })" },
      }),
    );
    expect(deps).toEqual(
      expect.arrayContaining(["scopes.root.done", "scopes.root.count"]),
    );
    expect(deps).toHaveLength(2);
  });
});

describe("extractDeps — the part parameter", () => {
  const entry = list({
    each: "scopes.root.rows",
    hidden: "scopes.root.done",
    props: { expr: "({ title: scopes.root.heading })" },
  });

  it('"each" returns only the each reads', () => {
    expect(extractDeps(entry, "each")).toEqual(["scopes.root.rows"]);
  });

  it('"render" returns only props and hidden reads', () => {
    const deps = extractDeps(entry, "render");
    expect(deps).toEqual(
      expect.arrayContaining(["scopes.root.heading", "scopes.root.done"]),
    );
    expect(deps).toHaveLength(2);
  });

  it('the default "all" is the union of both', () => {
    const deps = extractDeps(entry);
    expect(deps).toEqual(
      expect.arrayContaining([
        "scopes.root.rows",
        "scopes.root.heading",
        "scopes.root.done",
      ]),
    );
    expect(deps).toHaveLength(3);
  });
});

describe("extractDeps — caching and purity", () => {
  it("returns the same array reference for the same entry", () => {
    const c = element({ props: { expr: "scopes.root.count" } });
    expect(extractDeps(c)).toBe(extractDeps(c));
  });

  it("ignores stray top-level deps fields (deps is no longer accepted)", () => {
    // Belt-and-suspenders guard: if someone hand-writes an entry that
    // carries a legacy `deps: [...]` field, it MUST be ignored by the
    // extractor — auto-detection is the only source of truth.
    const c = element({ props: { expr: "scopes.root.real" } }) as unknown as
      ComponentEntry & { deps: string[] };
    c.deps = ["scopes.root.LEGACY_SHOULD_NOT_LEAK"];
    expect(extractDeps(c)).toEqual(["scopes.root.real"]);
  });
});
