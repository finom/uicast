import { describe, expect, it, vi } from "vitest";
import { waitFor } from "@testing-library/react";
import type { ComponentEntry } from "@uicast/core";
import { mountEntries } from "../../../test/render-helpers";

// Two document faults that used to escape classification: a children cycle ran out of heap, and a write to a missing scope surfaced as a raw TypeError.

const errorSlot = {
  error: ({ error, elementKey }: { error: Error; elementKey?: string }) => (
    <div data-error-for={elementKey}>
      {elementKey} failed: {error.message}
    </div>
  ),
};

describe("EntryRenderer — document faults that must not crash", () => {
  it("refuses a reachable children cycle instead of recursing", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const lines: ComponentEntry[] = [
      { key: "root", component: "Box", children: ["a"] },
      { key: "a", component: "Box", children: ["b"] },
      // b lists a as its child: root → a → b → a → …
      { key: "b", component: "Box", children: ["a"] },
    ];
    // Completing at all is the assertion — this used to exhaust the heap.
    const { container } = mountEntries(lines, { fallbackComponents: errorSlot });
    expect(container.textContent).toContain("failed:");
    expect(container.textContent).toContain("cycle");
    consoleError.mockRestore();
  });

  it("still renders a list whose rows carry the list's own key", () => {
    // A row re-enters the renderer under the list's key — that is not a cycle.
    const lines: ComponentEntry[] = [
      { key: "root", component: "Box", children: ["rows"] },
      {
        key: "rows",
        component: "Box",
        each: "scopes.root.items",
        as: "row",
        props: { expr: "({ text: scopes.row.$value })" },
      },
    ];
    const { container } = mountEntries(lines, { rootScope: { items: ["one", "two"] } });
    expect(container.textContent).toContain("one");
    expect(container.textContent).toContain("two");
  });

  it("classifies a write to a scope that does not exist", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const lines: ComponentEntry[] = [
      { key: "root", component: "Box", children: ["seeder"] },
      {
        key: "seeder",
        component: "Box",
        // `nope` is neither root nor any list's `as` name.
        seed: [{ set: "scopes.nope.x", literal: 1 }],
        props: { expr: "({ text: 'seeded' })" },
      },
    ];
    const { container } = mountEntries(lines, { fallbackComponents: errorSlot });
    await waitFor(() => {
      expect(container.textContent).toContain("seeder failed:");
    });
    expect(container.textContent).toContain("does not exist");
    consoleError.mockRestore();
  });
});
