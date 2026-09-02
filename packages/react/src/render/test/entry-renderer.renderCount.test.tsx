import { describe, expect, it } from "vitest";
import { StrictMode } from "react";
import { act, render } from "@testing-library/react";
import { z } from "zod";
import { createComponentDefinition, type ComponentEntry } from "@uicast/core";
import { createComponentImplementation, EntriesRenderer, RendererProvider } from "@uicast/react";
import type { InitFn } from "@uicast/react";
import { mountEntries, testEvaluator } from "../../../test/render-helpers";

// ---------------------------------------------------------------------------
// Render-once guarantee.
//
// The reactivity model promises that a *settled* entry renders exactly once and
// is not re-rendered when an UNRELATED entry streams in later, or when an
// ancestor re-renders for its own reasons. (Under React StrictMode in dev,
// every render is intentionally double-invoked, so the cap there is 2.)
//
// These tests pin that contract against the "storm" failure mode: without
// per-node subscriptions a settled leaf re-renders once per streaming tick —
// a leaf appearing on tick 2 of a 5-tick reveal would read 4 below, not 1.
// ---------------------------------------------------------------------------

const boxDef = createComponentDefinition({
  name: "Box",
  description: "A plain div that records each render keyed by entry id.",
  props: z.object({ text: z.string().optional() }),
});

// Fresh box renderer + a per-entry render-count map, isolated per test.
function countingSetup() {
  const counts: Record<string, number> = {};
  const boxRenderer = createComponentImplementation({
    def: boxDef,
    render: ({ text, children, generatedKey }) => {
      counts[generatedKey] = (counts[generatedKey] ?? 0) + 1;
      return (
        <div data-key={generatedKey}>
          {text}
          {children}
        </div>
      );
    },
  });
  const catalog = [boxRenderer];
  return { catalog, counts };
}

// A root whose children are all declared up-front, revealed one entry per tick
// (the slice() simulates the streaming JSONLines reveal `<EntriesRenderer>` is fed).
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

    // Each leaf mounts on the tick it streams in and is never re-rendered as
    // its siblings arrive afterwards.
    expect(counts.a).toBe(1);
    expect(counts.b).toBe(1);
    expect(counts.c).toBe(1);
    expect(counts.d).toBe(1);
    // The container, too: its element identity never changes, so it renders
    // once and bails on every subsequent tick.
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
      render: ({ text, children, generatedKey }) => {
        counts[generatedKey] = (counts[generatedKey] ?? 0) + 1;
        return (
          <div data-key={generatedKey}>
            {text}
            {children}
          </div>
        );
      },
    });
    const catalog = [boxRenderer];

    // Parent reads scopes.root.label; child reads nothing.
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

    // Mutate only the path the PARENT reads.
    act(() => {
      (captured as Record<string, Record<string, unknown>>).root.label =
        "changed";
    });

    // Parent re-rendered (it reads `label`); the child did not — the memo
    // bails the parent→child cascade.
    expect(counts.root).toBe(2);
    expect(counts.child).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// List subscriptions are split: the container subscribes to the `each` deps
// only, each item to its props + hidden deps only. Counts alone can't see the
// container (the impl render never runs for the container pass), so `gate` —
// a root path read ONLY by `each` — counts container evaluations instead.
// `counts.rows` aggregates the impl renders of every row.
// ---------------------------------------------------------------------------

describe("EntryRenderer — list container vs item subscriptions", () => {
  function listSetup() {
    const counts: Record<string, number> = {};
    const boxRenderer = createComponentImplementation({
      def: boxDef,
      render: ({ text, children, generatedKey }) => {
        counts[generatedKey] = (counts[generatedKey] ?? 0) + 1;
        return (
          <div data-key={generatedKey}>
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
          expr: "({ text: scopes.row.item.label + scopes.root.suffix })",
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
      scopes.root.$set("suffix", "!");
    });
    // Both rows re-rendered (their props read `suffix`); the container never
    // re-evaluated `each`.
    expect(counts.rows).toBe(4);
    expect(eachEvals.count).toBe(1);
  });

  it("a write to the each source re-renders the container once and each row once", () => {
    const { counts, eachEvals, scopes, container } = listSetup();
    expect(eachEvals.count).toBe(1);
    expect(counts.rows).toBe(2);

    act(() => {
      scopes.root.$set("items", [{ label: "c" }, { label: "d" }]);
    });
    expect(container.textContent).toContain("c");
    expect(container.textContent).toContain("d");
    // One container evaluation, one render per row — rows wake through their
    // rebuilt item scopes, not through a second subscription of their own.
    expect(eachEvals.count).toBe(2);
    expect(counts.rows).toBe(4);
  });
});
