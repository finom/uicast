import { describe, expect, it } from "vitest";
import type { ChunkComponent } from "ui-fired/core/types";
import { buildElementsById } from "ui-fired/core/utils/utils";

describe("RecursiveRenderer — partial replacement (buildElementsById contract)", () => {
  // The runtime contract is that re-emitting a chunk with the same `key` drops
  // its old descendants from the elements map before inserting the
  // replacement. `RecursiveRenderer` then re-walks the new subtree on the
  // next render. We test the contract at the `buildElementsById` layer since
  // it's the seam every persistence path goes through.
  it("re-emitting a chunk with the same key replaces and drops old descendants", () => {
    const initial: ChunkComponent[] = [
      {
        key: "root",
        component: "Box",
        op: "root",
        kind: "element",
        children: ["a"],
      },
      {
        key: "a",
        component: "Box",
        op: "child",
        kind: "element",
        children: ["a1"],
      },
      {
        key: "a1",
        component: "Box",
        op: "child",
        kind: "element",
      },
    ];
    const replaced: ChunkComponent[] = [
      ...initial,
      // Re-emit `a` with a fresh child set
      {
        key: "a",
        component: "Box",
        op: "child",
        kind: "element",
        children: ["a2"],
      },
      {
        key: "a2",
        component: "Box",
        op: "child",
        kind: "element",
      },
    ];

    const map = buildElementsById(replaced);
    expect(map.a).toBeDefined();
    expect(map.a.children).toEqual(["a2"]);
    expect(map.a2).toBeDefined();
    expect(map.a1).toBeUndefined();
  });

  it("preserves siblings that weren't re-emitted", () => {
    const lines: ChunkComponent[] = [
      {
        key: "root",
        component: "Box",
        op: "root",
        kind: "element",
        children: ["a", "b"],
      },
      { key: "a", component: "Box", op: "child", kind: "element" },
      { key: "b", component: "Box", op: "child", kind: "element" },
      // Re-emit only `a`
      { key: "a", component: "Box", op: "child", kind: "element" },
    ];
    const map = buildElementsById(lines);
    expect(map.b).toBeDefined();
  });
});
