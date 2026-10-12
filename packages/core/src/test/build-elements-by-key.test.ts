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
    const initial: ComponentEntry[] = [e("root", ["a", "b"]), e("a", ["a1"]), e("a1"), e("b")];
    const reemitted: ComponentEntry[] = [...initial, e("a", ["a2"]), e("a2")];
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
    const initial: ComponentEntry[] = [e("root", ["heading", "text"]), e("heading"), e("text")];
    const reemitted: ComponentEntry[] = [...initial, e("root", ["heading", "text", "quote"]), e("quote")];
    const map = buildElementsByKey(reemitted);
    expect(map.root.children).toEqual(["heading", "text", "quote"]);
    expect(map.heading).toBeDefined();
    expect(map.text).toBeDefined();
    expect(map.quote).toBeDefined();
  });

  it("kept-by-reference children retain their own subtrees", () => {
    const initial: ComponentEntry[] = [e("root", ["a", "b"]), e("a", ["a1"]), e("a1"), e("b")];
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
    const lines: ComponentEntry[] = [e("a", ["b"]), e("b", ["c"]), e("c"), e("a", ["c"])];
    const map = buildElementsByKey(lines);
    expect(map.a.children).toEqual(["c"]);
    expect(map.c).toBeDefined();
    expect(map.b).toBeUndefined();
  });

  it("keeps old keys an edit moves, in either line order", () => {
    const edits: [page: ComponentEntry[], edit: ComponentEntry[]][] = [
      // wrap: the table goes into a new card
      [
        [e("page", ["title", "table"]), e("title"), e("table", ["row"]), e("row")],
        [e("page", ["title", "card"]), e("card", ["table"])],
      ],
      // move out: save goes from the card up to the page
      [
        [e("page", ["card"]), e("card", ["field", "save"]), e("field"), e("save")],
        [e("page", ["card", "save"]), e("card", ["field"])],
      ],
      // move across: x goes from a to b
      [
        [e("page", ["a", "b"]), e("a", ["x"]), e("x", ["x1"]), e("x1"), e("b")],
        [e("a"), e("b", ["x"])],
      ],
    ];
    for (const [page, edit] of edits) {
      for (const lines of [
        [...page, ...edit],
        [...page, ...edit.toReversed()],
      ]) {
        const keys = [...new Set(lines.map((line) => line.key))].sort();
        expect(Object.keys(buildElementsByKey(lines)).sort()).toEqual(keys);
      }
    }
  });

  it("keeps the children of a moved key that is re-emitted too", () => {
    const page = [e("page", ["title", "table"]), e("title"), e("table", ["row"]), e("row")];
    const map = buildElementsByKey([...page, e("page", ["title", "card"]), e("card", ["table"]), e("table", ["row"])]);
    expect(map.row).toBeDefined();
  });
});
