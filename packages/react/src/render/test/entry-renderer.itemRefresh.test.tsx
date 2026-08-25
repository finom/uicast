import { act } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ComponentEntry } from "@uicast/core";
import { mountEntries } from "../../../test/render-helpers";

// Own file on purpose: React logs "Cannot update a component while rendering a
// different component" only ONCE per component pair per React instance, and any
// earlier list test in the same file would consume it. A fresh file gets a
// fresh React module, so the warning (if the bug returns) is observable here.
describe("EntryRenderer — item proxy refresh", () => {
  it("replacing the backing array does not set state during the list render", () => {
    // Regression: the per-item proxy refresh ran through the proxy's set trap
    // during render; with descendant-path fanout the emit woke `item.*`
    // subscribers mid-render and React warned.
    const warnings: string[] = [];
    const original = console.error;
    console.error = (...args: unknown[]) => {
      warnings.push(args.map(String).join(" "));
      original(...args);
    };
    try {
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
          keyBy: "id",
          each: "scopes.root.items",
          props: { expr: "({ text: scopes.row.item.label })" },
        },
      ];
      const { container, scopes } = mountEntries(lines, {
        rootScope: { items: [{ id: 1, label: "one" }] },
      });
      expect(container.textContent).toContain("one");

      act(() => {
        // Same ids, fresh objects — the mutate-then-refetch shape. Item
        // proxies are reused and refreshed during the list's render pass.
        scopes.root.$set("items", [
          { id: 1, label: "one*" },
          { id: 2, label: "two" },
        ]);
      });
      expect(container.textContent).toContain("one*");
      expect(container.textContent).toContain("two");
    } finally {
      console.error = original;
    }
    expect(
      warnings.filter((w) => w.includes("Cannot update a component")),
    ).toEqual([]);
  });
});
