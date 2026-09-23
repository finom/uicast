import { act, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { EntryError, ComponentEntry } from "@uicast/core";
import { mountEntries } from "../../../test/render-helpers";

describe("EntryRenderer — lists", () => {
  it("renders one child per item from each", () => {
    const lines: ComponentEntry[] = [
      {
        key: "root",
        component: "Box",
        children: ["rows"],
      },
      {
        key: "rows",
        component: "Box",
        as: "row",
        each: "scopes.root.items",
        props: { expr: "({ text: scopes.row.label })" },
      },
    ];
    const { container } = mountEntries(lines, {
      rootScope: { items: [{ label: "a" }, { label: "b" }, { label: "c" }] },
    });
    expect(container.textContent).toContain("a");
    expect(container.textContent).toContain("b");
    expect(container.textContent).toContain("c");
  });

  it("re-renders when each is replaced wholesale", () => {
    const lines: ComponentEntry[] = [
      {
        key: "root",
        component: "Box",
        children: ["rows"],
      },
      {
        key: "rows",
        component: "Box",
        as: "row",
        each: "scopes.root.items",
        props: { expr: "({ text: scopes.row.label })" },
      },
    ];
    const { container, scopes } = mountEntries(lines, {
      rootScope: { items: [{ label: "x" }] },
    });
    expect(container.textContent).toContain("x");

    act(() => {
      scopes.root.$set("items", [{ label: "y" }, { label: "z" }]);
    });
    expect(container.textContent).toContain("y");
    expect(container.textContent).toContain("z");
    expect(container.textContent).not.toContain("x");
  });

  it("renders nothing for an empty list", () => {
    const lines: ComponentEntry[] = [
      {
        key: "root",
        component: "Box",
        children: ["rows"],
        props: { expr: "({ text: 'parent-text' })" },
      },
      {
        key: "rows",
        component: "Box",
        as: "row",
        each: "scopes.root.items",
        props: { expr: "({ text: scopes.row.$value })" },
      },
    ];
    const { container } = mountEntries(lines, { rootScope: { items: [] } });
    expect(container.textContent).toContain("parent-text");
  });

  it("each expressions that read OTHER scope paths react too", () => {
    const lines: ComponentEntry[] = [
      {
        key: "root",
        component: "Box",
        children: ["rows"],
      },
      {
        key: "rows",
        component: "Box",
        as: "row",
        each:
          "scopes.root.items.filter(i => i.startsWith(scopes.root.search))",
        props: { expr: "({ text: scopes.row.$value })" },
      },
    ];
    const { container, scopes } = mountEntries(lines, {
      rootScope: { items: ["apple", "banana", "avocado"], search: "" },
    });
    expect(container.textContent).toContain("apple");
    expect(container.textContent).toContain("banana");
    expect(container.textContent).toContain("avocado");

    act(() => {
      scopes.root.$set("search", "a");
    });
    expect(container.textContent).toContain("apple");
    expect(container.textContent).toContain("avocado");
    expect(container.textContent).not.toContain("banana");
  });

  it("per-row state at root, keyed by $id, travels with the item when the array is reordered", async () => {
    const lines: ComponentEntry[] = [
      { key: "root", component: "Box", children: ["rows"] },
      {
        key: "rows",
        component: "Box",
        as: "row",
        each: "scopes.root.items",
        keyBy: "id",
        children: ["mark", "flag"],
      },
      {
        key: "mark",
        component: "Button",
        props: { expr: "({ label: 'mark-' + scopes.row.$id })" },
        callbacks: {
          onClick: [{ set: "scopes.root.flags", expr: "({ ...currentValue, [scopes.row.$id]: true })" }],
        },
      },
      {
        key: "flag",
        component: "Box",
        props: {
          expr: "({ text: scopes.row.$id + ':' + !!scopes.root.flags[scopes.row.$id] })",
        },
      },
    ];
    const { container, scopes, getByText } = mountEntries(lines, {
      rootScope: { items: [{ id: 1 }, { id: 2 }], flags: {} },
    });
    await act(async () => {
      fireEvent.click(getByText("mark-1"));
    });
    await waitFor(() => {
      expect(container.textContent).toContain("1:true");
    });
    expect(container.textContent).toContain("2:false");

    act(() => {
      scopes.root.$set("items", [{ id: 2 }, { id: 1 }]);
    });
    expect(container.textContent).toContain("1:true");
    expect(container.textContent).toContain("2:false");
  });

  it("keys primitives by index — per-item state is positional", async () => {
    const lines: ComponentEntry[] = [
      { key: "root", component: "Box", children: ["rows"] },
      {
        key: "rows",
        component: "Box",
        as: "row",
        each: "scopes.root.items",
        children: ["mark", "flag"],
      },
      {
        key: "mark",
        component: "Button",
        props: { expr: "({ label: 'mark-' + scopes.row.$value })" },
        callbacks: {
          onClick: [{ set: "scopes.root.flags", expr: "({ ...currentValue, [scopes.row.$id]: true })" }],
        },
      },
      {
        key: "flag",
        component: "Box",
        props: { expr: "({ text: scopes.row.$value + ':' + !!scopes.root.flags[scopes.row.$id] })" },
      },
    ];
    const { container, scopes, getByText } = mountEntries(lines, {
      rootScope: { items: ["a", "b"], flags: {} },
    });
    await act(async () => {
      fireEvent.click(getByText("mark-a"));
    });
    await waitFor(() => {
      expect(container.textContent).toContain("a:true");
    });
    expect(container.textContent).toContain("b:false");

    act(() => {
      scopes.root.$set("items", ["b", "a"]);
    });
    expect(container.textContent).toContain("b:true");
    expect(container.textContent).toContain("a:false");
  });

  it("routes a non-array each through the error slot and recovers on re-emit", () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const seen: EntryError[] = [];
    const lines: ComponentEntry[] = [
      { key: "root", component: "Box", children: ["rows"] },
      {
        key: "rows",
        component: "Box",
        as: "row",
        each: "scopes.root.n",
        props: { expr: "({ text: scopes.row.$value })" },
      },
    ];
    const { container, emit } = mountEntries(lines, {
      rootScope: { n: 42, items: ["first-item", "second-item"] },
      onError: (error) => seen.push(error),
      fallbackComponents: {
        error: ({ error, elementKey }) => (
          <div>
            {elementKey} failed: {error.message}
          </div>
        ),
      },
    });
    expect(container.textContent).toContain(
      'rows failed: List "each" must evaluate to an array',
    );
    expect(seen[0]?.reason).toBe("invalid-list");

    emit({
      key: "rows",
      component: "Box",
      as: "row",
      each: "scopes.root.items",
      props: { expr: "({ text: scopes.row.$value })" },
    });
    expect(container.textContent).not.toContain("rows failed:");
    expect(container.textContent).toContain("first-item");
    expect(container.textContent).toContain("second-item");
    consoleError.mockRestore();
  });

  it("a row write wakes readers of the source array", async () => {
    const lines: ComponentEntry[] = [
      { key: "root", component: "Box", children: ["rows", "total"] },
      {
        key: "rows",
        component: "Box",
        as: "row",
        each: "scopes.root.items",
        keyBy: "id",
        children: ["bump"],
      },
      {
        key: "bump",
        component: "Button",
        props: { expr: "({ label: 'bump-' + scopes.row.id })" },
        callbacks: {
          onClick: [{ set: "scopes.row.qty", expr: "currentValue + 1" }],
        },
      },
      {
        key: "total",
        component: "Box",
        props: {
          expr: "({ text: 'total:' + scopes.root.items.reduce((s, i) => s + i.qty, 0) })",
        },
      },
    ];
    const { container, getByText } = mountEntries(lines, {
      rootScope: { items: [{ id: 1, qty: 1 }, { id: 2, qty: 2 }] },
    });
    expect(container.textContent).toContain("total:3");
    await act(async () => {
      fireEvent.click(getByText("bump-1"));
    });
    await waitFor(() => {
      expect(container.textContent).toContain("total:4");
    });
  });

  it("a step reading the source array waits for a sibling row write", async () => {
    const lines: ComponentEntry[] = [
      { key: "root", component: "Box", children: ["rows", "sum"] },
      {
        key: "rows",
        component: "Box",
        as: "row",
        each: "scopes.root.items",
        keyBy: "id",
        children: ["set5"],
      },
      {
        key: "set5",
        component: "Button",
        props: { expr: "({ label: 'set5-' + scopes.row.id })" },
        callbacks: {
          onClick: [
            { set: "scopes.row.qty", literal: 5 },
            {
              set: "scopes.root.sum",
              expr: "scopes.root.items.reduce((s, i) => s + i.qty, 0)",
            },
          ],
        },
      },
      {
        key: "sum",
        component: "Box",
        props: { expr: "({ text: 'sum:' + scopes.root.sum })" },
      },
    ];
    const { container, getByText } = mountEntries(lines, {
      rootScope: { items: [{ id: 1, qty: 1 }, { id: 2, qty: 2 }] },
    });
    await act(async () => {
      fireEvent.click(getByText("set5-1"));
    });
    await waitFor(() => {
      expect(container.textContent).toContain("sum:7");
    });
  });

  it("a per-row flag at root is counted by a sibling of the list", async () => {
    const lines: ComponentEntry[] = [
      { key: "root", component: "Box", children: ["rows", "open"] },
      {
        key: "rows",
        component: "Box",
        as: "row",
        each: "scopes.root.items",
        keyBy: "id",
        children: ["toggle"],
      },
      {
        key: "toggle",
        component: "Button",
        props: { expr: "({ label: 'toggle-' + scopes.row.$id })" },
        callbacks: {
          onClick: [
            { set: "scopes.root.expanded", expr: "({ ...currentValue, [scopes.row.$id]: !currentValue[scopes.row.$id] })" },
          ],
        },
      },
      {
        key: "open",
        component: "Box",
        props: {
          expr: "({ text: 'open:' + Object.values(scopes.root.expanded).filter(v => v).length })",
        },
      },
    ];
    const { container, getByText } = mountEntries(lines, {
      rootScope: { items: [{ id: 1 }, { id: 2 }], expanded: {} },
    });
    await waitFor(() => {
      expect(container.textContent).toContain("open:0");
    });
    await act(async () => {
      fireEvent.click(getByText("toggle-1"));
    });
    await waitFor(() => {
      expect(container.textContent).toContain("open:1");
    });
  });

  it("a nested row write cascades to the outermost source array", async () => {
    const lines: ComponentEntry[] = [
      { key: "root", component: "Box", children: ["orders", "grand"] },
      {
        key: "orders",
        component: "Box",
        as: "order",
        each: "scopes.root.orders",
        keyBy: "id",
        children: ["items"],
      },
      {
        key: "items",
        component: "Box",
        as: "line",
        each: "scopes.order.lines",
        keyBy: "sku",
        children: ["bump"],
      },
      {
        key: "bump",
        component: "Button",
        props: { expr: "({ label: 'bump-' + scopes.line.sku })" },
        callbacks: {
          onClick: [{ set: "scopes.line.qty", expr: "currentValue + 1" }],
        },
      },
      {
        key: "grand",
        component: "Box",
        props: {
          expr: "({ text: 'grand:' + scopes.root.orders.reduce((s, o) => s + o.lines.reduce((t, l) => t + l.qty, 0), 0) })",
        },
      },
    ];
    const { container, getByText } = mountEntries(lines, {
      rootScope: {
        orders: [
          { id: 1, lines: [{ sku: "a", qty: 1 }] },
          { id: 2, lines: [{ sku: "b", qty: 2 }] },
        ],
      },
    });
    expect(container.textContent).toContain("grand:3");
    await act(async () => {
      fireEvent.click(getByText("bump-a"));
    });
    await waitFor(() => {
      expect(container.textContent).toContain("grand:4");
    });
  });
});
