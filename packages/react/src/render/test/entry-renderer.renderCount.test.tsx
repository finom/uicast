import { describe, expect, it } from "vitest";
import { StrictMode } from "react";
import { act, fireEvent, render, within } from "@testing-library/react";
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
  const { rerender } = render(
    <RendererProvider evaluator={testEvaluator} implementations={catalog}>
      <EntriesRenderer entries={REVEAL.slice(0, 1)} />
    </RendererProvider>,
  );
  for (let i = 2; i <= REVEAL.length; i++) {
    rerender(
      <RendererProvider evaluator={testEvaluator} implementations={catalog}>
        <EntriesRenderer entries={REVEAL.slice(0, i)} />
      </RendererProvider>,
    );
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
        <RendererProvider evaluator={testEvaluator} implementations={catalog}>
          <EntriesRenderer entries={REVEAL.slice(0, 1)} />
        </RendererProvider>
      </StrictMode>,
    );
    for (let i = 2; i <= REVEAL.length; i++) {
      rerender(
        <StrictMode>
          <RendererProvider evaluator={testEvaluator} implementations={catalog}>
            <EntriesRenderer entries={REVEAL.slice(0, i)} />
          </RendererProvider>
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

    render(
      <RendererProvider evaluator={testEvaluator} implementations={catalog} init={init}>
        <EntriesRenderer entries={lines} />
      </RendererProvider>,
    );
    expect(counts.root).toBe(1);
    expect(counts.child).toBe(1);

    act(() => {
      (captured as Record<string, Record<string, unknown>>).root.label = "changed";
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
      scopes.root.$set("suffix", "!");
    });
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
        props: { expr: "({ text: scopes.root.expanded[scopes.$row.id] ? 'open' : 'closed' })" },
      },
    ];
    const { scopes, container } = mountEntries(lines, {
      rootScope: { items },
      implementations: { Box: catalog[0] },
    });
    expect(counts.rows).toBe(200);
    act(() => {
      scopes.root.$set("expanded", { 7: true });
    });
    expect(container.querySelectorAll("div").length).toBe(201);
    expect(container.textContent).toContain("open");
    expect(counts.rows).toBe(201);
  });
});

describe("EntryRenderer — row write renders", () => {
  const rowDef = createComponentDefinition({
    name: "Row",
    description: "A button named by entry key and id, then a label; records each render by the button's name.",
    props: z.object({ id: z.union([z.string(), z.number()]), label: z.string() }),
    callbacks: { onClick: z.object({}).optional() },
  });

  // Every element reads the `tick` getter once per render, so `evals.count` counts element renders.
  function setup(lines: ComponentEntry[], rootScope: Record<string, unknown>) {
    const renders: Record<string, number> = {};
    const evals = { count: 0 };
    const count = (name: string) => {
      renders[name] = (renders[name] ?? 0) + 1;
    };
    const box = createComponentImplementation({
      def: boxDef,
      render: ({ text, children }, { entry }) => {
        count(entry.key);
        return (
          <div>
            {text}
            {children}
          </div>
        );
      },
    });
    const row = createComponentImplementation({
      def: rowDef,
      render: ({ id, label, onClick, children }, { entry }) => {
        count(`${entry.key}:${id}`);
        return (
          <div>
            <button type="button" onClick={() => onClick({})}>{`${entry.key}:${id}`}</button>
            {label}
            {children}
          </div>
        );
      },
    });
    const mounted = mountEntries(lines, {
      rootScope: {
        ...rootScope,
        get tick() {
          evals.count += 1;
          return "";
        },
      },
      implementations: { Box: box, Row: row },
    });
    // Earlier tests stay mounted, so queries look inside this one only.
    return { renders, evals, ...mounted, ...within(mounted.container) };
  }

  const toggle = (as: string) => ({ onClick: [{ set: `scopes.$${as}.open`, expr: "!currentValue" }] });
  const openLabel = (as: string) => `(scopes.$${as}.open ? 'open' : 'closed') + scopes.root.tick`;

  it("a write re-renders that row and nothing else", async () => {
    const { renders, evals, getByText } = setup(
      [
        {
          key: "root",
          component: "Box",
          props: { expr: "({ text: scopes.root.tick })" },
          children: ["rows", "footer"],
        },
        {
          key: "rows",
          component: "Row",
          each: "scopes.root.items",
          as: "row",
          keyBy: "id",
          props: { expr: `({ id: scopes.$row.id, label: ${openLabel("row")} })` },
          callbacks: toggle("row"),
        },
        { key: "footer", component: "Box", props: { expr: "({ text: scopes.root.tick })" } },
      ],
      { items: Array.from({ length: 5 }, (_, i) => ({ id: i })) },
    );
    const before = { ...renders };
    const evalsBefore = evals.count;
    await act(async () => {
      fireEvent.click(getByText("rows:2"));
    });
    expect(getByText("rows:2").parentElement?.textContent).toBe("rows:2open");
    expect(evals.count - evalsBefore).toBe(1);
    expect(renders).toEqual({ ...before, "rows:2": 2 });
  });

  it("an inner row's write re-renders that inner row only; an outer row's write, the outer row only", async () => {
    const { renders, evals, getByText } = setup(
      [
        { key: "root", component: "Box", props: { expr: "({ text: scopes.root.tick })" }, children: ["orders"] },
        {
          key: "orders",
          component: "Row",
          each: "scopes.root.orders",
          as: "order",
          keyBy: "id",
          props: { expr: `({ id: scopes.$order.id, label: ${openLabel("order")} })` },
          callbacks: toggle("order"),
          children: ["lines"],
        },
        {
          key: "lines",
          component: "Row",
          each: "scopes.order.lines",
          as: "line",
          keyBy: "id",
          props: { expr: `({ id: scopes.$order.id + '/' + scopes.$line.id, label: ${openLabel("line")} })` },
          callbacks: toggle("line"),
        },
      ],
      {
        orders: [
          { id: "A", lines: [{ id: 1 }, { id: 2 }] },
          { id: "B", lines: [{ id: 1 }, { id: 2 }] },
        ],
      },
    );
    const before = { ...renders };
    let evalsBefore = evals.count;
    await act(async () => {
      fireEvent.click(getByText("lines:A/2"));
    });
    expect(evals.count - evalsBefore).toBe(1);
    expect(renders).toEqual({ ...before, "lines:A/2": 2 });

    evalsBefore = evals.count;
    await act(async () => {
      fireEvent.click(getByText("orders:A"));
    });
    expect(evals.count - evalsBefore).toBe(1);
    expect(renders).toEqual({ ...before, "lines:A/2": 2, "orders:A": 2 });
    expect(getByText("orders:A").parentElement?.textContent).toBe("orders:Aopenlines:A/1closedlines:A/2open");
  });

  const bump = (as: string) => ({ onClick: [{ set: `scopes.${as}.qty`, expr: "currentValue + 1" }] });

  it("an item write re-renders that row and the readers of the array, nothing else", async () => {
    const { renders, evals, getByText, scopes } = setup(
      [
        { key: "root", component: "Box", props: { expr: "({ text: scopes.root.tick })" }, children: ["rows", "total"] },
        {
          key: "rows",
          component: "Row",
          each: "scopes.root.items",
          as: "row",
          keyBy: "id",
          props: { expr: "({ id: scopes.$row.id, label: 'qty ' + scopes.row.qty + scopes.root.tick })" },
          callbacks: bump("row"),
        },
        {
          key: "total",
          component: "Box",
          props: { expr: "({ text: 'total ' + scopes.root.items.reduce((s, i) => s + i.qty, 0) + scopes.root.tick })" },
        },
      ],
      { items: Array.from({ length: 5 }, (_, i) => ({ id: i, qty: 1 })) },
    );
    const items = scopes.root.items;
    const before = { ...renders };
    const evalsBefore = evals.count;
    await act(async () => {
      fireEvent.click(getByText("rows:2"));
    });
    expect(getByText("rows:2").parentElement?.textContent).toBe("rows:2qty 2");
    expect(evals.count - evalsBefore).toBe(2);
    expect(renders).toEqual({ ...before, "rows:2": 2, total: 2 });
    expect(scopes.root.items).not.toBe(items);
  });

  it("a nested item write re-renders that inner row and the readers of the outer array, nothing else", async () => {
    const { renders, evals, getByText } = setup(
      [
        {
          key: "root",
          component: "Box",
          props: { expr: "({ text: scopes.root.tick })" },
          children: ["orders", "total"],
        },
        {
          key: "orders",
          component: "Row",
          each: "scopes.root.orders",
          as: "order",
          keyBy: "id",
          props: { expr: "({ id: scopes.$order.id, label: scopes.order.id + scopes.root.tick })" },
          children: ["lines"],
        },
        {
          key: "lines",
          component: "Row",
          each: "scopes.order.lines",
          as: "line",
          keyBy: "id",
          props: {
            expr: "({ id: scopes.$order.id + '/' + scopes.$line.id, label: 'qty ' + scopes.line.qty + scopes.root.tick })",
          },
          callbacks: bump("line"),
        },
        {
          key: "total",
          component: "Box",
          props: {
            expr: "({ text: 'total ' + scopes.root.orders.reduce((s, o) => s + o.lines.reduce((t, l) => t + l.qty, 0), 0) + scopes.root.tick })",
          },
        },
      ],
      { orders: ["A", "B"].map((id) => ({ id, lines: [1, 2].map((n) => ({ id: n, qty: 1 })) })) },
    );
    const before = { ...renders };
    const evalsBefore = evals.count;
    await act(async () => {
      fireEvent.click(getByText("lines:A/2"));
    });
    expect(getByText("lines:A/2").parentElement?.textContent).toBe("lines:A/2qty 2");
    expect(evals.count - evalsBefore).toBe(2);
    expect(renders).toEqual({ ...before, "lines:A/2": 2, total: 2 });
  });
});
