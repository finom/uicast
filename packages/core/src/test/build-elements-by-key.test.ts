import { describe, expect, it } from "vitest";
import type { ComponentEntry } from "../types";
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
    const initial: ComponentEntry[] = [
      e("root", ["a", "b"]),
      e("a", ["a1"]),
      e("a1"),
      e("b"),
    ];
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
    expect(map.b).toBeDefined();
  });

  it("treats the most recent occurrence of a key as the winner", () => {
    const lines: ComponentEntry[] = [e("x"), { ...e("x"), component: "Y" }];
    const map = buildElementsByKey(lines);
    expect(map.x.component).toBe("Y");
  });

  it("re-emitted entry keeps old children it still references", () => {
    const initial: ComponentEntry[] = [
      e("root", ["heading", "text"]),
      e("heading"),
      e("text"),
    ];
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
    const initial: ComponentEntry[] = [
      e("root", ["a", "b"]),
      e("a", ["a1"]),
      e("a1"),
      e("b"),
    ];
    const reemitted: ComponentEntry[] = [...initial, e("root", ["a"])];
    const map = buildElementsByKey(reemitted);
    expect(map.a).toBeDefined();
    expect(map.a1).toBeDefined();
    expect(map.b).toBeUndefined();
  });

  it("keeps prototype names as plain keys", () => {
    const lines: ComponentEntry[] = [e("__proto__", ["toString"]), e("constructor")];
    const map = buildElementsByKey(lines);
    expect(Object.getPrototypeOf(map)).toBeNull();
    expect(Object.keys(map).sort()).toEqual(["__proto__", "constructor"]);
    expect(Reflect.get(map, "__proto__")).toBe(lines[0]);
    expect(map.toString).toBeUndefined();
    expect(buildElementsByKey([...lines, e("__proto__")]).constructor).toBe(lines[1]);
  });

  it("re-emitting a parent can re-parent an old grandchild", () => {
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
