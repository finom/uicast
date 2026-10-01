import { act, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { type ComponentEntry, createComponentDefinition, type EntryError } from "@uicast/core";
import { createComponentImplementation } from "@uicast/react";
import { mountEntries } from "../../../test/render-helpers";

const list = (patch: Partial<ComponentEntry> = {}): ComponentEntry => ({
  key: "rows",
  component: "Box",
  as: "row",
  each: "scopes.root.items",
  keyBy: "id",
  ...patch,
});

describe("EntryRenderer — row windows", () => {
  it("reads the item's fields from `<as>`, and index and id from `$<as>`", () => {
    const lines: ComponentEntry[] = [
      { key: "root", component: "Box", children: ["rows"] },
      list({ props: { expr: "({ text: scopes.$row.index + '/' + scopes.$row.id + '/' + scopes.row.name + ';' })" } }),
    ];
    const { container } = mountEntries(lines, {
      rootScope: {
        items: [
          { id: "a", name: "Ada" },
          { id: "b", name: "Bob" },
        ],
      },
    });
    expect(container.textContent).toBe("0/a/Ada;1/b/Bob;");
  });

  it("`$<as>.value` reads a primitive item; a row of primitives cannot be written", async () => {
    const seen: EntryError[] = [];
    const lines: ComponentEntry[] = [
      { key: "root", component: "Box", children: ["rows"] },
      list({
        keyBy: undefined,
        props: { expr: "({ text: scopes.$row.value })" },
        children: ["poke"],
      }),
      {
        key: "poke",
        component: "Button",
        props: { expr: "({ label: 'poke-' + scopes.$row.value })" },
        callbacks: { onClick: [{ set: "scopes.row.x", literal: 1 }] },
      },
    ];
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const { container, getByText } = mountEntries(lines, {
      rootScope: { items: ["red"] },
      onError: (e) => seen.push(e),
    });
    expect(container.textContent).toContain("red");
    await act(async () => {
      fireEvent.click(getByText("poke-red"));
    });
    await waitFor(() => expect(seen).toHaveLength(1));
    expect(seen[0].reason).toBe("guardrail-violation");
    expect(seen[0].message).toContain("holds a string");
    consoleError.mockRestore();
  });

  it("a write to the index, id or value of `$<as>` is refused at mount", () => {
    const seen: EntryError[] = [];
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    mountEntries(
      [
        { key: "root", component: "Box", children: ["rows"] },
        list({ callbacks: { onClick: [{ set: "scopes.$row.index", literal: 0 }] } }),
      ],
      { rootScope: { items: [{ id: 1 }] }, onError: (e) => seen.push(e) },
    );
    expect(seen[0]?.reason).toBe("guardrail-violation");
    expect(seen[0]?.message).toContain("read-only");
    consoleError.mockRestore();
  });

  it("an edit through a filtered `each` replaces the item in the source array", async () => {
    const lines: ComponentEntry[] = [
      { key: "root", component: "Box", children: ["rows", "total"] },
      list({
        each: "scopes.root.items.filter(i => i.qty > 0)",
        children: ["bump"],
      }),
      {
        key: "bump",
        component: "Button",
        props: { expr: "({ label: 'fbump-' + scopes.$row.id })" },
        callbacks: { onClick: [{ set: "scopes.row.qty", expr: "currentValue + 1" }] },
      },
      {
        key: "total",
        component: "Box",
        props: { expr: "({ text: 'total:' + scopes.root.items.reduce((s, i) => s + i.qty, 0) })" },
      },
    ];
    const items = [
      { id: 1, qty: 1 },
      { id: 2, qty: 0 },
    ];
    const { container, getByText, scopes } = mountEntries(lines, { rootScope: { items } });
    expect(container.textContent).toContain("total:1");
    await act(async () => {
      fireEvent.click(getByText("fbump-1"));
    });
    await waitFor(() => expect(container.textContent).toContain("total:2"));
    expect(scopes.root.items).toEqual([
      { id: 1, qty: 2 },
      { id: 2, qty: 0 },
    ]);
    expect(items[0].qty).toBe(1);
  });

  it("an edit through a sorted `each` replaces the item in the source array, and index is the sorted position", async () => {
    const lines: ComponentEntry[] = [
      { key: "root", component: "Box", children: ["rows"] },
      list({
        each: "scopes.root.items.toSorted((a, b) => a.name.localeCompare(b.name))",
        props: { expr: "({ text: scopes.$row.index + ':' + scopes.row.name + ';' })" },
        children: ["rename"],
      }),
      {
        key: "rename",
        component: "Button",
        props: { expr: "({ label: 'rename-' + scopes.$row.id })" },
        callbacks: { onClick: [{ set: "scopes.row.name", literal: "Zed" }] },
      },
    ];
    const items = [
      { id: 1, name: "Bob" },
      { id: 2, name: "Ada" },
    ];
    const { container, getByText, scopes } = mountEntries(lines, { rootScope: { items } });
    expect(container.textContent).toContain("0:Ada;");
    expect(container.textContent).toContain("1:Bob;");
    await act(async () => {
      fireEvent.click(getByText("rename-2"));
    });
    await waitFor(() => expect(container.textContent).toContain("1:Zed;"));
    expect((scopes.root.items as { name: string }[])[1].name).toBe("Zed");
    expect(items[1].name).toBe("Ada");
  });

  it("`each` that builds new objects refuses the write, classified", async () => {
    const seen: EntryError[] = [];
    const lines: ComponentEntry[] = [
      { key: "root", component: "Box", children: ["rows"] },
      list({
        each: "scopes.root.items.map(i => ({ ...i, double: i.qty * 2 }))",
        children: ["bump"],
      }),
      {
        key: "bump",
        component: "Button",
        props: { expr: "({ label: 'nbump-' + scopes.$row.id })" },
        callbacks: { onClick: [{ set: "scopes.row.qty", literal: 9 }] },
      },
    ];
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const items = [{ id: 1, qty: 1 }];
    const { getByText } = mountEntries(lines, { rootScope: { items }, onError: (e) => seen.push(e) });
    await act(async () => {
      fireEvent.click(getByText("nbump-1"));
    });
    await waitFor(() => expect(seen).toHaveLength(1));
    expect(seen[0].reason).toBe("unknown-reference");
    expect(seen[0].message).toContain("built a new object");
    expect(items[0].qty).toBe(1);
    consoleError.mockRestore();
  });

  it("a component given the array or the whole item sees an edit; the host's array is untouched", async () => {
    const List = createComponentImplementation({
      def: createComponentDefinition({
        name: "List",
        description: "Every qty in the array it gets.",
        props: z.object({ items: z.array(z.any()) }),
      }),
      render: ({ items, children }) => (
        <div>
          {`list:${items.map((i: { qty: number }) => i.qty).join(",")};`}
          {children}
        </div>
      ),
    });
    const Record = createComponentImplementation({
      def: createComponentDefinition({
        name: "Record",
        description: "One record's qty; a click bumps it.",
        props: z.object({ record: z.any() }),
        callbacks: { onClick: z.object({}).optional() },
      }),
      render: ({ record, onClick }) => (
        <button type="button" onClick={() => onClick({})}>{`${record.id}:${record.qty};`}</button>
      ),
    });
    const items = [
      { id: 1, qty: 1 },
      { id: 2, qty: 1 },
    ];
    const { container, getByText } = mountEntries(
      [
        { key: "root", component: "List", props: { expr: "({ items: scopes.root.items })" }, children: ["rows"] },
        list({
          component: "Record",
          props: { expr: "({ record: scopes.row })" },
          callbacks: { onClick: [{ set: "scopes.row.qty", expr: "currentValue + 1" }] },
        }),
      ],
      { rootScope: { items }, implementations: { List, Record } },
    );
    await act(async () => {
      fireEvent.click(getByText("2:1;"));
    });
    expect(container.textContent).toBe("list:1,2;1:1;2:2;");
    expect(items).toEqual([
      { id: 1, qty: 1 },
      { id: 2, qty: 1 },
    ]);
  });

  it("a refetch with the same ids re-points each row and re-renders it", async () => {
    const lines: ComponentEntry[] = [
      { key: "root", component: "Box", children: ["rows"] },
      list({ props: { expr: "({ text: scopes.row.name + ';' })" } }),
    ];
    const { container, scopes } = mountEntries(lines, {
      rootScope: { items: [{ id: 1, name: "Ada" }] },
    });
    expect(container.textContent).toBe("Ada;");
    act(() => {
      scopes.root.$set("items", [{ id: 1, name: "Hopper" }]);
    });
    expect(container.textContent).toBe("Hopper;");
  });

  it("a row deletes itself through the root array", async () => {
    const lines: ComponentEntry[] = [
      { key: "root", component: "Box", children: ["rows"] },
      list({ children: ["del"] }),
      {
        key: "del",
        component: "Button",
        props: { expr: "({ label: 'del-' + scopes.$row.id })" },
        callbacks: {
          onClick: [{ set: "scopes.root.items", expr: "currentValue.filter(i => i.id !== scopes.$row.id)" }],
        },
      },
    ];
    const { container, getByText } = mountEntries(lines, {
      rootScope: { items: [{ id: 1 }, { id: 2 }] },
    });
    await act(async () => {
      fireEvent.click(getByText("del-1"));
    });
    await waitFor(() => expect(container.textContent).not.toContain("del-1"));
    expect(container.textContent).toContain("del-2");
  });

  it("a write after the row was dropped fails as unknown-reference", async () => {
    const seen: EntryError[] = [];
    const lines: ComponentEntry[] = [
      { key: "root", component: "Box", children: ["rows"] },
      list({ children: ["del"] }),
      {
        key: "del",
        component: "Button",
        props: { expr: "({ label: 'drop-' + scopes.$row.id })" },
        callbacks: {
          onClick: [
            { set: "scopes.root.items", expr: "currentValue.filter(i => i.id !== scopes.$row.id)" },
            { set: "scopes.row.gone", literal: true },
          ],
        },
      },
    ];
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const { getByText } = mountEntries(lines, {
      rootScope: { items: [{ id: 1 }] },
      onError: (e) => seen.push(e),
    });
    await act(async () => {
      fireEvent.click(getByText("drop-1"));
    });
    await waitFor(() => expect(seen).toHaveLength(1));
    expect(seen[0].reason).toBe("unknown-reference");
    expect(seen[0].message).toContain("the row was removed");
    consoleError.mockRestore();
  });

  it("two lists over one array both see one edit", async () => {
    const lines: ComponentEntry[] = [
      { key: "root", component: "Box", children: ["a", "b"] },
      list({ key: "a", as: "ra", props: { expr: "({ text: 'A' + scopes.ra.n + ';' })" }, children: ["bump"] }),
      list({ key: "b", as: "rb", props: { expr: "({ text: 'B' + scopes.rb.n + ';' })" } }),
      {
        key: "bump",
        component: "Button",
        props: { expr: "({ label: 'tbump-' + scopes.$ra.id })" },
        callbacks: { onClick: [{ set: "scopes.ra.n", expr: "currentValue + 1" }] },
      },
    ];
    const { container, getByText } = mountEntries(lines, {
      rootScope: { items: [{ id: 1, n: 1 }] },
    });
    expect(container.textContent).toContain("B1;");
    await act(async () => {
      fireEvent.click(getByText("tbump-1"));
    });
    await waitFor(() => expect(container.textContent).toContain("B2;"));
    expect(container.textContent).toContain("A2;");
  });

  it("duplicate keyBy values keep separate rows", () => {
    const lines: ComponentEntry[] = [
      { key: "root", component: "Box", children: ["rows"] },
      list({ props: { expr: "({ text: scopes.$row.id + ':' + scopes.row.n + ';' })" } }),
    ];
    const { container } = mountEntries(lines, {
      rootScope: {
        items: [
          { id: 1, n: "x" },
          { id: 1, n: "y" },
        ],
      },
    });
    expect(container.textContent).toBe("1:x;1#2:y;");
  });

  it('keyBy values 1 and "1" are one id, so the rows get distinct keys', () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const lines: ComponentEntry[] = [
      { key: "root", component: "Box", children: ["rows"] },
      list({ props: { expr: "({ text: scopes.$row.id + ':' + scopes.row.n + ';' })" } }),
    ];
    const { container } = mountEntries(lines, {
      rootScope: {
        items: [
          { id: 1, n: "x" },
          { id: "1", n: "y" },
        ],
      },
    });
    expect(container.textContent).toBe("1:x;1#2:y;");
    expect(consoleError.mock.calls.flat().join(" ")).not.toContain("same key");
    consoleError.mockRestore();
  });

  it("a keyBy value that is not a string or number keys the row by its index", () => {
    const lines: ComponentEntry[] = [
      { key: "root", component: "Box", children: ["rows"] },
      list({ props: { expr: "({ text: scopes.$row.id + ';' })" } }),
    ];
    const { container } = mountEntries(lines, {
      rootScope: { items: [{ id: { a: 1 } }, { id: true }] },
    });
    expect(container.textContent).toBe("0;1;");
  });

  it("a `set` without the scopes. prefix is refused at mount", () => {
    const seen: EntryError[] = [];
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    mountEntries([{ key: "root", component: "Box", seed: [{ set: "root.count", literal: 1 }] }], {
      onError: (e) => seen.push(e),
    });
    expect(seen[0]?.reason).toBe("guardrail-violation");
    expect(seen[0]?.message).toContain("is not an address");
    consoleError.mockRestore();
  });
});

describe("EntryRenderer — row state", () => {
  // A click flips that row's own `open`.
  const toggles = (each: string): ComponentEntry[] => [
    { key: "root", component: "Box", children: ["rows"] },
    {
      key: "rows",
      component: "Button",
      each,
      as: "row",
      keyBy: "id",
      props: { expr: "({ label: scopes.row.name + (scopes.$row.open ? ' open' : '') })" },
      callbacks: { onClick: [{ set: "scopes.$row.open", expr: "!currentValue" }] },
    },
  ];
  const items = () => [
    { id: 1, name: "a" },
    { id: 2, name: "b" },
  ];

  it("keeps a row's own state in `$<as>`, out of the data", async () => {
    const { getByText, container, scopes } = mountEntries(toggles("scopes.root.items"), {
      rootScope: { items: items() },
    });
    await act(async () => {
      fireEvent.click(getByText("a"));
    });
    expect(container.textContent).toBe("a openb");
    expect(scopes.root.items).toEqual(items());
  });

  it("keeps a row's state when a filter hides the row and shows it again", async () => {
    const { getByText, container, scopes } = mountEntries(
      toggles("scopes.root.items.filter(i => i.name.includes(scopes.root.q))"),
      { rootScope: { q: "", items: items() } },
    );
    await act(async () => {
      fireEvent.click(getByText("a"));
    });
    act(() => scopes.root.$set("q", "b"));
    expect(container.textContent).toBe("b");
    act(() => scopes.root.$set("q", ""));
    expect(container.textContent).toBe("a openb");
  });

  it("keeps a nested row's state when its outer row leaves and comes back", async () => {
    const lines: ComponentEntry[] = [
      { key: "root", component: "Box", children: ["orders"] },
      {
        key: "orders",
        component: "Box",
        each: "scopes.root.orders.filter(o => o.id !== scopes.root.hidden)",
        as: "order",
        keyBy: "id",
        children: ["lines"],
      },
      {
        key: "lines",
        component: "Button",
        each: "scopes.order.lines",
        as: "line",
        keyBy: "id",
        props: { expr: "({ label: scopes.order.id + scopes.line.id + (scopes.$line.open ? '+' : '') + ';' })" },
        callbacks: { onClick: [{ set: "scopes.$line.open", expr: "!currentValue" }] },
      },
    ];
    const { getByText, container, scopes } = mountEntries(lines, {
      rootScope: {
        hidden: null,
        orders: [
          { id: "A", lines: [{ id: 1 }, { id: 2 }] },
          { id: "B", lines: [{ id: 1 }] },
        ],
      },
    });
    await act(async () => {
      fireEvent.click(getByText("A1;"));
    });
    // B's line 1 has the same id in another order, so it stays closed.
    expect(container.textContent).toBe("A1+;A2;B1;");
    act(() => scopes.root.$set("hidden", "A"));
    expect(container.textContent).toBe("B1;");
    act(() => scopes.root.$set("hidden", null));
    expect(container.textContent).toBe("A1+;A2;B1;");
  });
});
