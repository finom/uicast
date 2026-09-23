import { act, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ComponentEntry, EntryError } from "@uicast/core";
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
  it("reads the element's fields and the runtime's $index / $id", () => {
    const lines: ComponentEntry[] = [
      { key: "root", component: "Box", children: ["rows"] },
      list({ props: { expr: "({ text: scopes.row.$index + '/' + scopes.row.$id + '/' + scopes.row.name + ';' })" } }),
    ];
    const { container } = mountEntries(lines, {
      rootScope: { items: [{ id: "a", name: "Ada" }, { id: "b", name: "Bob" }] },
    });
    expect(container.textContent).toBe("0/a/Ada;1/b/Bob;");
  });

  it("$value reads a primitive element; a row of primitives cannot be written", async () => {
    const seen: EntryError[] = [];
    const lines: ComponentEntry[] = [
      { key: "root", component: "Box", children: ["rows"] },
      list({
        keyBy: undefined,
        props: { expr: "({ text: scopes.row.$value })" },
        children: ["poke"],
      }),
      {
        key: "poke",
        component: "Button",
        props: { expr: "({ label: 'poke-' + scopes.row.$value })" },
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

  it("a write to $id, $index or $value is refused at mount", () => {
    const seen: EntryError[] = [];
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    mountEntries(
      [
        { key: "root", component: "Box", children: ["rows"] },
        list({ callbacks: { onClick: [{ set: "scopes.row.$index", literal: 0 }] } }),
      ],
      { rootScope: { items: [{ id: 1 }] }, onError: (e) => seen.push(e) },
    );
    expect(seen[0]?.reason).toBe("guardrail-violation");
    expect(seen[0]?.message).toContain("read-only");
    consoleError.mockRestore();
  });

  it("an edit through a filtered `each` reaches the source array", async () => {
    const lines: ComponentEntry[] = [
      { key: "root", component: "Box", children: ["rows", "total"] },
      list({
        each: "scopes.root.items.filter(i => i.qty > 0)",
        children: ["bump"],
      }),
      {
        key: "bump",
        component: "Button",
        props: { expr: "({ label: 'fbump-' + scopes.row.$id })" },
        callbacks: { onClick: [{ set: "scopes.row.qty", expr: "currentValue + 1" }] },
      },
      {
        key: "total",
        component: "Box",
        props: { expr: "({ text: 'total:' + scopes.root.items.reduce((s, i) => s + i.qty, 0) })" },
      },
    ];
    const items = [{ id: 1, qty: 1 }, { id: 2, qty: 0 }];
    const { container, getByText } = mountEntries(lines, { rootScope: { items } });
    expect(container.textContent).toContain("total:1");
    await act(async () => {
      fireEvent.click(getByText("fbump-1"));
    });
    await waitFor(() => expect(container.textContent).toContain("total:2"));
    expect(items[0].qty).toBe(2);
  });

  it("an edit through a sorted `each` reaches the source array, and $index is the sorted position", async () => {
    const lines: ComponentEntry[] = [
      { key: "root", component: "Box", children: ["rows"] },
      list({
        each: "scopes.root.items.toSorted((a, b) => a.name.localeCompare(b.name))",
        props: { expr: "({ text: scopes.row.$index + ':' + scopes.row.name + ';' })" },
        children: ["rename"],
      }),
      {
        key: "rename",
        component: "Button",
        props: { expr: "({ label: 'rename-' + scopes.row.$id })" },
        callbacks: { onClick: [{ set: "scopes.row.name", literal: "Zed" }] },
      },
    ];
    const items = [{ id: 1, name: "Bob" }, { id: 2, name: "Ada" }];
    const { container, getByText } = mountEntries(lines, { rootScope: { items } });
    expect(container.textContent).toContain("0:Ada;");
    expect(container.textContent).toContain("1:Bob;");
    await act(async () => {
      fireEvent.click(getByText("rename-2"));
    });
    await waitFor(() => expect(container.textContent).toContain("1:Zed;"));
    expect(items[1].name).toBe("Zed");
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
        props: { expr: "({ label: 'nbump-' + scopes.row.$id })" },
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
        props: { expr: "({ label: 'del-' + scopes.row.$id })" },
        callbacks: {
          onClick: [{ set: "scopes.root.items", expr: "currentValue.filter(i => i.id !== scopes.row.$id)" }],
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
        props: { expr: "({ label: 'drop-' + scopes.row.$id })" },
        callbacks: {
          onClick: [
            { set: "scopes.root.items", expr: "currentValue.filter(i => i.id !== scopes.row.$id)" },
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
        props: { expr: "({ label: 'tbump-' + scopes.ra.$id })" },
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
      list({ props: { expr: "({ text: scopes.row.$id + ':' + scopes.row.n + ';' })" } }),
    ];
    const { container } = mountEntries(lines, {
      rootScope: { items: [{ id: 1, n: "x" }, { id: 1, n: "y" }] },
    });
    expect(container.textContent).toBe("1:x;1#2:y;");
  });

  it("keyBy values 1 and \"1\" are one id, so the rows get distinct keys", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const lines: ComponentEntry[] = [
      { key: "root", component: "Box", children: ["rows"] },
      list({ props: { expr: "({ text: scopes.row.$id + ':' + scopes.row.n + ';' })" } }),
    ];
    const { container } = mountEntries(lines, {
      rootScope: { items: [{ id: 1, n: "x" }, { id: "1", n: "y" }] },
    });
    expect(container.textContent).toBe("1:x;1#2:y;");
    expect(consoleError.mock.calls.flat().join(" ")).not.toContain("same key");
    consoleError.mockRestore();
  });

  it("a keyBy value that is not a string or number keys the row by its index", () => {
    const lines: ComponentEntry[] = [
      { key: "root", component: "Box", children: ["rows"] },
      list({ props: { expr: "({ text: scopes.row.$id + ';' })" } }),
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
