import { act } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ChunkComponent } from "ui-fired/core/types";
import { mountChunks } from "../../test/renderHelpers";

describe("RecursiveRenderer — lists", () => {
  it("renders one child per item from itemsSource", () => {
    const lines: ChunkComponent[] = [
      {
        key: "root",
        component: "Box",
        op: "root",
        kind: "element",
        children: ["rows"],
      },
      {
        key: "rows",
        component: "Box",
        op: "child",
        kind: "list",
        itemScope: "row",
        itemsSource: "scopes.root.items",
        props: { expr: "({ text: scopes.row.item.label })" },
      },
    ];
    const { container } = mountChunks(lines, {
      rootScope: { items: [{ label: "a" }, { label: "b" }, { label: "c" }] },
    });
    expect(container.textContent).toContain("a");
    expect(container.textContent).toContain("b");
    expect(container.textContent).toContain("c");
  });

  it("re-renders when itemsSource is replaced wholesale", () => {
    const lines: ChunkComponent[] = [
      {
        key: "root",
        component: "Box",
        op: "root",
        kind: "element",
        children: ["rows"],
      },
      {
        key: "rows",
        component: "Box",
        op: "child",
        kind: "list",
        itemScope: "row",
        itemsSource: "scopes.root.items",
        props: { expr: "({ text: scopes.row.item.label })" },
      },
    ];
    const { container, scopes } = mountChunks(lines, {
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
    const lines: ChunkComponent[] = [
      {
        key: "root",
        component: "Box",
        op: "root",
        kind: "element",
        children: ["rows"],
        props: { expr: "({ text: 'parent-text' })" },
      },
      {
        key: "rows",
        component: "Box",
        op: "child",
        kind: "list",
        itemScope: "row",
        itemsSource: "scopes.root.items",
        props: { expr: "({ text: scopes.row.item })" },
      },
    ];
    const { container } = mountChunks(lines, { rootScope: { items: [] } });
    expect(container.textContent).toContain("parent-text");
  });

  it("itemsSource expressions that read OTHER scope paths react too", () => {
    // Bug-class regression: a list whose itemsSource references another path
    // (e.g. a search filter) must subscribe to that path so typing into a
    // search input re-renders the list.
    const lines: ChunkComponent[] = [
      {
        key: "root",
        component: "Box",
        op: "root",
        kind: "element",
        children: ["rows"],
      },
      {
        key: "rows",
        component: "Box",
        op: "child",
        kind: "list",
        itemScope: "row",
        itemsSource:
          "scopes.root.items.filter(i => i.startsWith(scopes.root.search))",
        props: { expr: "({ text: scopes.row.item })" },
      },
    ];
    const { container, scopes } = mountChunks(lines, {
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
