import { describe, expect, it } from "vitest";
import { StrictMode } from "react";
import { act, render } from "@testing-library/react";
import { z } from "zod";
import { createComponentDefinition, type ComponentEntry } from "@uicast/core";
import { createComponentImplementation, EntriesRenderer, RendererProvider } from "@uicast/react";
import type { InitFn } from "@uicast/react";
import { mountEntries, testEvaluator } from "../../../test/render-helpers";

const boxDef = createComponentDefinition({
  name: "Box",
  description: "A plain div that records each render keyed by entry id.",
  props: z.object({ text: z.string().optional() }),
});

function countingSetup() {
  const counts: Record<string, number> = {};
  const boxRenderer = createComponentImplementation({
    def: boxDef,
    render: ({ text, children }, { entry }) => {
      counts[entry.key] = (counts[entry.key] ?? 0) + 1;
      return (
        <div data-key={entry.key}>
          {text}
          {children}
        </div>
      );
    },
  });
  const catalog = [boxRenderer];
  return { catalog, counts };
}

const REVEAL: ComponentEntry[] = [
  { key: "root", component: "Box", children: ["a", "b", "c", "d"] },
  { key: "a", component: "Box", props: { expr: "({ text: 'A' })" } },
  { key: "b", component: "Box", props: { expr: "({ text: 'B' })" } },
  { key: "c", component: "Box", props: { expr: "({ text: 'C' })" } },
  { key: "d", component: "Box", props: { expr: "({ text: 'D' })" } },
];

function streamReveal(catalog: ReturnType<typeof countingSetup>["catalog"]) {
  const { rerender } = render(<RendererProvider evaluator={testEvaluator} implementations={catalog}><EntriesRenderer entries={REVEAL.slice(0, 1)} /></RendererProvider>);
  for (let i = 2; i <= REVEAL.length; i++) {
    rerender(<RendererProvider evaluator={testEvaluator} implementations={catalog}><EntriesRenderer entries={REVEAL.slice(0, i)} /></RendererProvider>);
  }
}

describe("EntryRenderer — render-once during streaming", () => {
  it("renders every settled entry EXACTLY once across the whole reveal", () => {
    const { catalog, counts } = countingSetup();
    streamReveal(catalog);

    expect(counts.a).toBe(1);
    expect(counts.b).toBe(1);
    expect(counts.c).toBe(1);
    expect(counts.d).toBe(1);
    expect(counts.root).toBe(1);
  });

  it("allows at most 2 renders per entry under React StrictMode (dev double-invoke)", () => {
    const { catalog, counts } = countingSetup();
    const { rerender } = render(
      <StrictMode>
        <RendererProvider evaluator={testEvaluator} implementations={catalog}><EntriesRenderer entries={REVEAL.slice(0, 1)} /></RendererProvider>
      </StrictMode>,
    );
    for (let i = 2; i <= REVEAL.length; i++) {
      rerender(
        <StrictMode>
          <RendererProvider evaluator={testEvaluator} implementations={catalog}><EntriesRenderer entries={REVEAL.slice(0, i)} /></RendererProvider>
        </StrictMode>,
      );
    }

    for (const key of ["root", "a", "b", "c", "d"]) {
      expect(counts[key], `entry ${key}`).toBeGreaterThanOrEqual(1);
      expect(counts[key], `entry ${key}`).toBeLessThanOrEqual(2);
    }
  });
});

describe("EntryRenderer — render-once on state change", () => {
  it("a parent re-rendering on its own state change does NOT cascade to a child", () => {
    const counts: Record<string, number> = {};
    const boxRenderer = createComponentImplementation({
      def: boxDef,
      render: ({ text, children }, { entry }) => {
        counts[entry.key] = (counts[entry.key] ?? 0) + 1;
        return (
          <div data-key={entry.key}>
            {text}
            {children}
          </div>
        );
      },
    });
    const catalog = [boxRenderer];

    const lines: ComponentEntry[] = [
      {
        key: "root",
        component: "Box",
        children: ["child"],
        props: { expr: "({ text: scopes.root.label })" },
      },
      { key: "child", component: "Box", props: { expr: "({ text: 'static' })" } },
    ];

    let captured: Parameters<InitFn>[0]["scopes"] | undefined;
    const init: InitFn = ({ scopes }) => {
      (scopes.root as Record<string, unknown>).label = "init";
      captured = scopes;
    };

    render(<RendererProvider evaluator={testEvaluator} implementations={catalog} init={init}><EntriesRenderer entries={lines} /></RendererProvider>);
    expect(counts.root).toBe(1);
    expect(counts.child).toBe(1);

    act(() => {
      (captured as Record<string, Record<string, unknown>>).root.label =
        "changed";
    });

    expect(counts.root).toBe(2);
    expect(counts.child).toBe(1);
  });
});

// The impl never renders for the container pass, so the `gate` getter, read only by `each`,
// counts container evaluations; `counts.rows` sums the renders of every row.
describe("EntryRenderer — list container vs item subscriptions", () => {
  function listSetup() {
    const counts: Record<string, number> = {};
    const boxRenderer = createComponentImplementation({
      def: boxDef,
      render: ({ text, children }, { entry }) => {
        counts[entry.key] = (counts[entry.key] ?? 0) + 1;
        return (
          <div data-key={entry.key}>
            {text}
            {children}
          </div>
        );
      },
    });
    const eachEvals = { count: 0 };
    const rootScope = {
      suffix: "",
      items: [{ label: "a" }, { label: "b" }],
      get gate() {
        eachEvals.count += 1;
        return true;
      },
    };
    const lines: ComponentEntry[] = [
      { key: "root", component: "Box", children: ["rows"] },
      {
        key: "rows",
        component: "Box",
        as: "row",
        each: "scopes.root.gate ? scopes.root.items : scopes.root.items",
        props: {
          expr: "({ text: scopes.row.label + scopes.root.suffix })",
        },
      },
    ];
    const mounted = mountEntries(lines, {
      rootScope,
      implementations: { Box: boxRenderer },
    });
    return { counts, eachEvals, ...mounted };
  }

  it("a write to a root path only the items' props read does not re-render the container", () => {
    const { counts, eachEvals, scopes } = listSetup();
    expect(eachEvals.count).toBe(1);
    expect(counts.rows).toBe(2);

    act(() => {
      scopes.root.$$set("suffix", "!");
    });
    expect(counts.rows).toBe(4);
    expect(eachEvals.count).toBe(1);
  });

  it("a write to the each source re-renders the container once and each row once", () => {
    const { counts, eachEvals, scopes, container } = listSetup();
    expect(eachEvals.count).toBe(1);
    expect(counts.rows).toBe(2);

    act(() => {
      scopes.root.$$set("items", [{ label: "c" }, { label: "d" }]);
    });
    expect(container.textContent).toContain("c");
    expect(container.textContent).toContain("d");
    expect(eachEvals.count).toBe(2);
    expect(counts.rows).toBe(4);
  });
});

describe("EntryRenderer — props memo", () => {
  it("a root-map toggle re-renders one row, not all of them", () => {
    const { catalog, counts } = countingSetup();
    const items = Array.from({ length: 200 }, (_, i) => ({ id: i }));
    const lines: ComponentEntry[] = [
      {
        key: "root",
        component: "Box",
        seed: [{ set: "scopes.root.expanded", literal: {} }],
        children: ["rows"],
      },
      {
        key: "rows",
        component: "Box",
        as: "row",
        each: "scopes.root.items",
        keyBy: "id",
        props: { expr: "({ text: scopes.root.expanded[scopes.row.$$id] ? 'open' : 'closed' })" },
      },
    ];
    const { scopes, container } = mountEntries(lines, {
      rootScope: { items },
      implementations: { Box: catalog[0] },
    });
    expect(counts.rows).toBe(200);
    act(() => {
      scopes.root.$$set("expanded", { 7: true });
    });
    expect(container.querySelectorAll("div").length).toBe(201);
    expect(container.textContent).toContain("open");
    expect(counts.rows).toBe(201);
  });
});
