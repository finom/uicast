import { describe, expect, it } from "vitest";
import type { ChunkComponent } from "@ui-fired/core/types";
import { mountChunks } from "../../../test/renderHelpers";

describe("RecursiveRenderer — children", () => {
  it("renders children in declared order", () => {
    const lines: ChunkComponent[] = [
      {
        key: "root",
        component: "Box",
        children: ["a", "b", "c"],
      },
      {
        key: "a",
        component: "Box",
        props: { expr: "({ text: 'first' })" },
      },
      {
        key: "b",
        component: "Box",
        props: { expr: "({ text: 'second' })" },
      },
      {
        key: "c",
        component: "Box",
        props: { expr: "({ text: 'third' })" },
      },
    ];
    const { container } = mountChunks(lines);
    const text = container.textContent ?? "";
    expect(text.indexOf("first")).toBeLessThan(text.indexOf("second"));
    expect(text.indexOf("second")).toBeLessThan(text.indexOf("third"));
  });

  it("preserves props-supplied text when children is an empty array (eac4926 fix)", () => {
    // If the renderer leaks an empty `children: []` past the guard, it would
    // overwrite the `text` prop the renderer reads. The fix collapses empty
    // children to null so the props-supplied content survives.
    const lines: ChunkComponent[] = [
      {
        key: "root",
        component: "Box",
        children: [],
        props: { expr: "({ text: 'from-props' })" },
      },
    ];
    const { container } = mountChunks(lines);
    expect(container.textContent).toContain("from-props");
  });

  it("treats a missing children field as no children (leaf chunk)", () => {
    const lines: ChunkComponent[] = [
      {
        key: "root",
        component: "Box",
        props: { expr: "({ text: 'just-me' })" },
      },
    ];
    const { container } = mountChunks(lines);
    expect(container.textContent).toContain("just-me");
  });
});
