import type { ErrorComponentProps } from "@uicast/react";
import { describe, expect, it, vi } from "vitest";
import { act, waitFor } from "@testing-library/react";
import type { ComponentEntry } from "@uicast/core";
import type { StandardToolV0 } from "standard-tool";
import { mountEntries } from "../../../test/render-helpers";

const errorSlot = {
  error: ({ error }: ErrorComponentProps) => (
    <div data-error-for={error.elementKey}>
      {error.elementKey} failed: {error.message}
    </div>
  ),
};

describe("EntryRenderer — seeds on list elements", () => {
  it("a self-initializing list seeds its own `each` state (sync)", () => {
    const lines: ComponentEntry[] = [
      { key: "root", component: "Box", children: ["the-list"] },
      {
        key: "the-list",
        component: "Box",
        seed: [{ set: "scopes.root.rows", literal: ["one", "two"] }],
        each: "scopes.root.rows",
        as: "row",
        props: { expr: "({ text: scopes.row.$$value })" },
      },
    ];
    const { container } = mountEntries(lines);
    expect(container.textContent).toContain("one");
    expect(container.textContent).toContain("two");
  });

  it("a self-initializing list seeds via an async host function and renders when it lands", async () => {
    const fetchRows = vi.fn(async () => ["alpha", "beta"]);
    const functions: StandardToolV0[] = [{ name: "fetchRows", description: "", execute: fetchRows }];
    const lines: ComponentEntry[] = [
      { key: "root", component: "Box", children: ["the-list"] },
      {
        key: "the-list",
        component: "Box",
        seed: [{ set: "scopes.root.rows", expr: "fetchRows()" }],
        each: "scopes.root.rows",
        as: "row",
        props: { expr: "({ text: scopes.row.$$value })" },
      },
    ];
    let container!: HTMLElement;
    await act(async () => {
      ({ container } = mountEntries(lines, { functions }));
    });
    await waitFor(() => {
      expect(container.textContent).toContain("alpha");
    });
    expect(container.textContent).toContain("beta");
    expect(fetchRows).toHaveBeenCalledTimes(1);
  });

  it("an effectful seed on a non-empty list runs once, not once per item", () => {
    const count = vi.fn(() => "counted");
    const functions: StandardToolV0[] = [{ name: "countCall", description: "", execute: count as () => unknown }];
    const lines: ComponentEntry[] = [
      {
        key: "root",
        component: "Box",
        seed: [{ set: "scopes.root.items", literal: ["a", "b", "c"] }],
        children: ["the-list"],
      },
      {
        key: "the-list",
        component: "Box",
        seed: [{ set: "scopes.root.marker", expr: "countCall()" }],
        each: "scopes.root.items",
        as: "row",
        props: { expr: "({ text: scopes.row.$$value })" },
      },
    ];
    const { container } = mountEntries(lines, { functions });
    expect(container.textContent).toContain("a");
    expect(container.textContent).toContain("c");
    expect(count).toHaveBeenCalledTimes(1);
  });

  it("a failing list seed latches the list slot, not the parent", async () => {
    const lines: ComponentEntry[] = [
      {
        key: "root",
        component: "Box",
        props: { expr: "({ text: 'parent-alive' })" },
        children: ["the-list"],
      },
      {
        key: "the-list",
        component: "Box",
        seed: [{ set: "scopes.root.rows", expr: "document.title" }],
        each: "scopes.root.rows",
        as: "row",
        props: { expr: "({ text: scopes.row.$$value })" },
      },
    ];
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const { container } = mountEntries(lines, { fallbackComponents: errorSlot });
    await waitFor(() => {
      expect(container.textContent).toContain("the-list failed:");
    });
    expect(container.textContent).toContain("parent-alive");
    consoleError.mockRestore();
  });
});
