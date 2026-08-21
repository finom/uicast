import { describe, expect, it, vi } from "vitest";
import { act, waitFor } from "@testing-library/react";
import type { ComponentEntry } from "uicast";
import type { StandardToolV0 } from "standard-tool";
import { mountEntries } from "../../../test/render-helpers";

// Seed semantics on LIST elements: the contract blesses initializing the
// `each` state via a seed on the list element itself, and a seed runs exactly
// once per element — on the container pass, never once per item.

const errorSlot = {
  error: ({ error, elementKey }: { error: Error; elementKey?: string }) => (
    <div data-error-for={elementKey}>
      {elementKey} failed: {error.message}
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
        props: { expr: "({ text: scopes.row.item })" },
      },
    ];
    const { container } = mountEntries(lines);
    expect(container.textContent).toContain("one");
    expect(container.textContent).toContain("two");
  });

  it("a self-initializing list seeds via an async host function and renders when it lands", async () => {
    const fetchRows = vi.fn(async () => ["alpha", "beta"]);
    const functions: StandardToolV0[] = [
      { name: "fetchRows", description: "", execute: fetchRows },
    ];
    const lines: ComponentEntry[] = [
      { key: "root", component: "Box", children: ["the-list"] },
      {
        key: "the-list",
        component: "Box",
        seed: [{ set: "scopes.root.rows", expr: "fetchRows()" }],
        each: "scopes.root.rows",
        as: "row",
        props: { expr: "({ text: scopes.row.item })" },
      },
    ];
    // Awaited act: Suspense resumption after the seed settles only flushes
    // under act in React 19 + testing-library (see renderer.init.test.tsx).
    let container!: HTMLElement;
    await act(async () => {
      ({ container } = mountEntries(lines, { functions }));
    });
    await waitFor(() => {
      expect(container.textContent).toContain("alpha");
    });
    expect(container.textContent).toContain("beta");
    // Once per ELEMENT, not per item: two rendered items, one seed execution.
    expect(fetchRows).toHaveBeenCalledTimes(1);
  });

  it("an effectful seed on a non-empty list runs once, not once per item", () => {
    const count = vi.fn(() => "counted");
    const functions: StandardToolV0[] = [
      { name: "countCall", description: "", execute: count as () => unknown },
    ];
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
        props: { expr: "({ text: scopes.row.item })" },
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
        props: { expr: "({ text: scopes.row.item })" },
      },
    ];
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const { container } = mountEntries(lines, { defaultComponents: errorSlot });
    await waitFor(() => {
      expect(container.textContent).toContain("the-list failed:");
    });
    expect(container.textContent).toContain("parent-alive");
    consoleError.mockRestore();
  });
});
