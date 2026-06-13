import { describe, expect, it } from "vitest";
import type { ComponentEntry } from "../../types";
import { buildElementsById } from "../utils";

const e = (key: string, children?: string[]): ComponentEntry => ({
  key,
  component: "C",
  children,
});

describe("buildElementsById", () => {
  it("indexes chunks by key", () => {
    const lines: ComponentEntry[] = [e("a"), e("b"), e("c")];
    const map = buildElementsById(lines);
    expect(Object.keys(map).sort()).toEqual(["a", "b", "c"]);
    expect(map.a).toBe(lines[0]);
  });

  it("re-emitted chunk replaces and drops orphaned descendants", () => {
    // Initial tree: root -> [a -> [a1], b]
    const initial: ComponentEntry[] = [
      e("root", ["a", "b"]),
      e("a", ["a1"]),
      e("a1"),
      e("b"),
    ];
    // Re-emit `a` with a new child `a2`; `a1` should be dropped from the map.
    const reemitted: ComponentEntry[] = [
      ...initial,
      e("a", ["a2"]),
      e("a2"),
    ];
    const map = buildElementsById(reemitted);
    expect(map.a).toBeDefined();
    expect(map.a.children).toEqual(["a2"]);
    expect(map.a2).toBeDefined();
    expect(map.a1).toBeUndefined();
    // Siblings (b) and unrelated branches survive.
    expect(map.b).toBeDefined();
  });

  it("treats the most recent occurrence of a key as the winner", () => {
    const lines: ComponentEntry[] = [e("x"), { ...e("x"), component: "Y" }];
    const map = buildElementsById(lines);
    expect(map.x.component).toBe("Y");
  });
});
