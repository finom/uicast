import { act } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ComponentEntry } from "@uicast/core";
import { mountEntries } from "../../../test/render-helpers";

// Own file: React warns "Cannot update a component while rendering…" once per component pair
// per React instance, so an earlier test in the same file would swallow it.
describe("EntryRenderer — item proxy refresh", () => {
  it("replacing the backing array does not set state during the list render", () => {
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
          props: { expr: "({ text: scopes.row.label })" },
        },
      ];
      const { container, scopes } = mountEntries(lines, {
        rootScope: { items: [{ id: 1, label: "one" }] },
      });
      expect(container.textContent).toContain("one");

      act(() => {
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
    expect(warnings.filter((w) => w.includes("Cannot update a component"))).toEqual([]);
  });
});
