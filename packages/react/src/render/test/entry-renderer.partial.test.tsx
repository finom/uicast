import { describe, expect, it } from "vitest";
import { buildElementsById, type ComponentEntry } from "@uicast/core";

describe("EntryRenderer — partial replacement (buildElementsById contract)", () => {
  // The runtime contract is that re-emitting an entry with the same `key` drops
  // its old descendants from the elements map before inserting the
  // replacement. `EntryRenderer` then re-walks the new subtree on the
  // next render. We test the contract at the `buildElementsById` layer since
  // it's the seam every persistence path goes through.
  it("re-emitting an entry with the same key replaces and drops old descendants", () => {
    const initial: ComponentEntry[] = [
      {
        key: "root",
        component: "Box",
        children: ["a"],
      },
      {
        key: "a",
        component: "Box",
        children: ["a1"],
      },
      {
        key: "a1",
        component: "Box",
      },
    ];
    const replaced: ComponentEntry[] = [
      ...initial,
      // Re-emit `a` with a fresh child set
      {
        key: "a",
        component: "Box",
        children: ["a2"],
      },
      {
        key: "a2",
        component: "Box",
      },
    ];

    const map = buildElementsById(replaced);
    expect(map.a).toBeDefined();
    expect(map.a.children).toEqual(["a2"]);
    expect(map.a2).toBeDefined();
    expect(map.a1).toBeUndefined();
  });

  it("preserves siblings that weren't re-emitted", () => {
    const lines: ComponentEntry[] = [
      {
        key: "root",
        component: "Box",
        children: ["a", "b"],
      },
      { key: "a", component: "Box" },
      { key: "b", component: "Box" },
      // Re-emit only `a`
      { key: "a", component: "Box" },
    ];
    const map = buildElementsById(lines);
    expect(map.b).toBeDefined();
  });
});
