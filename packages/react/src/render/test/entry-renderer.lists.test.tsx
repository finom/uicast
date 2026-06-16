import { act } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ComponentEntry } from "@ui-fired/core";
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
        props: { expr: "({ text: scopes.row.item.label })" },
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
        props: { expr: "({ text: scopes.row.item.label })" },
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
        props: { expr: "({ text: scopes.row.item })" },
      },
    ];
    const { container } = mountEntries(lines, { rootScope: { items: [] } });
    expect(container.textContent).toContain("parent-text");
  });

  it("each expressions that read OTHER scope paths react too", () => {
    // Bug-class regression: a list whose each references another path
    // (e.g. a search filter) must subscribe to that path so typing into a
    // search input re-renders the list.
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
        props: { expr: "({ text: scopes.row.item })" },
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
});
