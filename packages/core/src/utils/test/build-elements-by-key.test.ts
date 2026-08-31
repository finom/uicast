import { describe, expect, it } from "vitest";
import type { ComponentEntry } from "../../types";
import { buildElementsByKey } from "../build-elements-by-key";

const e = (key: string, children?: string[]): ComponentEntry => ({
  key,
  component: "C",
  children,
});

describe("buildElementsByKey", () => {
  it("indexes entries by key", () => {
    const lines: ComponentEntry[] = [e("a"), e("b"), e("c")];
    const map = buildElementsByKey(lines);
    expect(Object.keys(map).sort()).toEqual(["a", "b", "c"]);
    expect(map.a).toBe(lines[0]);
  });

  it("re-emitted entry replaces and drops orphaned descendants", () => {
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
    const map = buildElementsByKey(reemitted);
    expect(map.a).toBeDefined();
    expect(map.a.children).toEqual(["a2"]);
    expect(map.a2).toBeDefined();
    expect(map.a1).toBeUndefined();
    // Siblings (b) and unrelated branches survive.
    expect(map.b).toBeDefined();
  });

  it("treats the most recent occurrence of a key as the winner", () => {
    const lines: ComponentEntry[] = [e("x"), { ...e("x"), component: "Y" }];
    const map = buildElementsByKey(lines);
    expect(map.x.component).toBe("Y");
  });

  it("re-emitted entry keeps old children it still references", () => {
    // Initial tree: root -> [heading, text]
    const initial: ComponentEntry[] = [
      e("root", ["heading", "text"]),
      e("heading"),
      e("text"),
    ];
    // Re-emit `root` appending `quote`; heading/text are referenced, not re-emitted.
    const reemitted: ComponentEntry[] = [
      ...initial,
      e("root", ["heading", "text", "quote"]),
      e("quote"),
    ];
    const map = buildElementsByKey(reemitted);
    expect(map.root.children).toEqual(["heading", "text", "quote"]);
    expect(map.heading).toBeDefined();
    expect(map.text).toBeDefined();
    expect(map.quote).toBeDefined();
  });

  it("kept-by-reference children retain their own subtrees", () => {
    // Initial tree: root -> [a -> [a1], b]
    const initial: ComponentEntry[] = [
      e("root", ["a", "b"]),
      e("a", ["a1"]),
      e("a1"),
      e("b"),
    ];
    // Re-emit `root` dropping `b` but keeping `a` by reference: a1 survives, b goes.
    const reemitted: ComponentEntry[] = [...initial, e("root", ["a"])];
    const map = buildElementsByKey(reemitted);
    expect(map.a).toBeDefined();
    expect(map.a1).toBeDefined();
    expect(map.b).toBeUndefined();
  });

  it("re-emitting a parent can re-parent an old grandchild", () => {
    // Initial tree: a -> [b -> [c]]; re-emit `a` referencing `c` directly.
    const lines: ComponentEntry[] = [
      e("a", ["b"]),
      e("b", ["c"]),
      e("c"),
      e("a", ["c"]),
    ];
    const map = buildElementsByKey(lines);
    expect(map.a.children).toEqual(["c"]);
    expect(map.c).toBeDefined();
    expect(map.b).toBeUndefined();
  });
});
