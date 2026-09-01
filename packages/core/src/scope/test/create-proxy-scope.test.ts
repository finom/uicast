import { describe, expect, it, vi } from "vitest";
import { EntryError } from "../../entry-error";
import { createEmitter, createProxyScope } from "../create-proxy-scope";

describe("createProxyScope — reads", () => {
  it("returns the same proxy reference for the same source object", () => {
    const state = createProxyScope({ user: { name: "Ada" } });
    expect(state.user).toBe(state.user);
  });

  it("returns raw values for primitives", () => {
    const state = createProxyScope({ count: 0 });
    expect(state.count).toBe(0);
  });

  it("exposes $emitter / $set on the root only", () => {
    const state = createProxyScope({ nested: { a: 1 } });
    expect(typeof state.$emitter).toBe("object");
    expect(typeof state.$set).toBe("function");
    // Sub-proxies should NOT expose root-only hooks
    expect((state.nested as unknown as { $emitter?: unknown }).$emitter).toBe(
      undefined,
    );
  });
});

describe("createProxyScope — writes and emits", () => {
  it("emits on direct property assignment", () => {
    const state = createProxyScope<{ count: number }>({ count: 0 });
    const spy = vi.fn();
    state.$emitter.on("count", spy);
    state.count = 1;
    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith({ path: "count", value: 1, oldValue: 0 });
  });

  it("emits at the full dotted path for nested writes", () => {
    const state = createProxyScope<{ user: { name: string } }>({
      user: { name: "Ada" },
    });
    const spy = vi.fn();
    state.$emitter.on("user.name", spy);
    state.user.name = "Hopper";
    expect(spy).toHaveBeenCalledWith({
      path: "user.name",
      value: "Hopper",
      oldValue: "Ada",
    });
  });

  it("does not emit when the value didn't change (idempotence)", () => {
    const state = createProxyScope<{ count: number }>({ count: 5 });
    const spy = vi.fn();
    state.$emitter.on("count", spy);
    state.count = 5;
    expect(spy).not.toHaveBeenCalled();
  });

  it("subscribes path-exact — parent subscriber does NOT see child writes", () => {
    const state = createProxyScope<{ rows: { name: string }[] }>({
      rows: [{ name: "first" }],
    });
    const parentSpy = vi.fn();
    state.$emitter.on("rows", parentSpy);
    state.rows[0].name = "renamed";
    expect(parentSpy).not.toHaveBeenCalled();
  });

  it("subscribes path-exact — child subscriber sees only matching writes", () => {
    const state = createProxyScope<{ rows: { name: string }[] }>({
      rows: [{ name: "first" }],
    });
    const childSpy = vi.fn();
    state.$emitter.on("rows.0.name", childSpy);
    state.rows[0].name = "renamed";
    expect(childSpy).toHaveBeenCalledOnce();
  });

  it("ancestor write wakes descendant subscribers", () => {
    const state = createProxyScope<{ products: { id: number }[] }>({
      products: [{ id: 1 }],
    });
    const lengthSpy = vi.fn();
    state.$emitter.on("products.length", lengthSpy);
    state.$set("products", [{ id: 1 }, { id: 2 }]);
    expect(lengthSpy).toHaveBeenCalledOnce();
  });

  it("ancestor write does not wake sibling-path subscribers", () => {
    const state = createProxyScope<{ products: unknown[]; orders: unknown[] }>({
      products: [],
      orders: [],
    });
    const orderSpy = vi.fn();
    state.$emitter.on("orders.length", orderSpy);
    state.$set("products", [1]);
    expect(orderSpy).not.toHaveBeenCalled();
  });
});

describe("createProxyScope — emitter version", () => {
  it("starts at 0 and advances on a real write with no subscribers", () => {
    const state = createProxyScope<{ count: number }>({ count: 0 });
    expect(state.$emitter.version).toBe(0);
    state.count = 1;
    expect(state.$emitter.version).toBe(1);
  });

  it("does not advance on an idempotent same-value write", () => {
    const state = createProxyScope<{ count: number }>({ count: 5 });
    state.count = 5;
    expect(state.$emitter.version).toBe(0);
  });

  it("advances by 2 for writes to two different paths", () => {
    const state = createProxyScope<{ a: number; b: number }>({ a: 1, b: 1 });
    state.a = 2;
    state.b = 2;
    expect(state.$emitter.version).toBe(2);
  });
});

describe("createProxyScope — array mutation through the proxy", () => {
  it("push emits on the new index path, not on exact \"rows\"", () => {
    const state = createProxyScope<{ rows: { id: number }[] }>({
      rows: [{ id: 1 }, { id: 2 }],
    });
    const indexSpy = vi.fn();
    const rowsSpy = vi.fn();
    state.$emitter.on("rows.2", indexSpy);
    state.$emitter.on("rows", rowsSpy);
    state.rows.push({ id: 3 });
    expect(indexSpy).toHaveBeenCalledOnce();
    expect(rowsSpy).not.toHaveBeenCalled();
  });

  // Known limitation, pinned: by the time push writes `length`, the raw
  // array's length has already advanced from the index write, so the length
  // write is idempotent and never emits. A "rows.length" subscriber only
  // wakes when the array itself is replaced (the ancestor-write test above).
  // Any future fix must consciously flip this assertion.
  it("push does NOT wake a \"rows.length\" subscriber (pinned limitation)", () => {
    const state = createProxyScope<{ rows: { id: number }[] }>({
      rows: [{ id: 1 }],
    });
    const lengthSpy = vi.fn();
    state.$emitter.on("rows.length", lengthSpy);
    state.rows.push({ id: 2 });
    expect(state.rows).toHaveLength(2);
    expect(lengthSpy).not.toHaveBeenCalled();
  });
});

describe("createProxyScope — $set", () => {
  it("$set walks dotted segments once the parents exist", () => {
    const state = createProxyScope<{ a?: { b?: { c?: string } } }>({
      a: { b: {} },
    });
    state.$set("a.b.c", "hello");
    expect(state.a?.b?.c).toBe("hello");
  });

  // Inventing the parent would make a typo (`usre.name`) and `tags.0` silent
  // no-ops. Throwing turns both into a classified document fault.
  it("$set throws instead of inventing a missing parent", () => {
    const state = createProxyScope<Record<string, unknown>>({});
    expect(() => state.$set("a.b.c", "hello")).toThrow(/"a" is not set/);
    expect(state.a).toBeUndefined();
  });

  it("$set on a missing parent throws a classified unknown-reference EntryError", () => {
    const state = createProxyScope<Record<string, unknown>>({});
    try {
      state.$set("a.b", 1);
      expect.unreachable();
    } catch (err) {
      expect(EntryError.is(err) && err.reason).toBe("unknown-reference");
    }
  });

  it("$set through a primitive parent throws the same classified error", () => {
    const state = createProxyScope<{ count: number }>({ count: 5 });
    try {
      state.$set("count.x", 1);
      expect.unreachable();
    } catch (err) {
      expect(EntryError.is(err) && err.reason).toBe("unknown-reference");
      expect(err).toMatchObject({ message: expect.stringContaining('"count" is not an object') });
    }
    expect(state.count).toBe(5);
  });

  it("$set with { default: true } only writes when the leaf is undefined", () => {
    const state = createProxyScope<{ count?: number }>({});
    state.$set("count", 1, { default: true });
    expect(state.count).toBe(1);
    state.$set("count", 99, { default: true });
    expect(state.count).toBe(1);
    // without the flag it overwrites as usual
    state.$set("count", 99);
    expect(state.count).toBe(99);
  });

  it("$set with { default: true } does not overwrite an existing null", () => {
    // Absence is `undefined` only — a seeded null is a value, not a hole.
    const state = createProxyScope<{ x: null | number }>({ x: null });
    state.$set("x", 5, { default: true });
    expect(state.x).toBeNull();
  });
});

describe("createProxyScope — emitter unsubscribe", () => {
  it("on() returns an unsubscribe function", () => {
    const state = createProxyScope<{ count: number }>({ count: 0 });
    const spy = vi.fn();
    const off = state.$emitter.on("count", spy);
    state.count = 1;
    off();
    state.count = 2;
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

describe("createEmitter — standalone", () => {
  it("emits to all registered handlers for a path", () => {
    const e = createEmitter();
    const a = vi.fn();
    const b = vi.fn();
    e.on("foo", a);
    e.on("foo", b);
    const payload = { path: "foo", value: 1, oldValue: undefined };
    e.emit("foo", payload);
    expect(a).toHaveBeenCalledWith(payload);
    expect(b).toHaveBeenCalledWith(payload);
  });

  it("the function returned by on() detaches the handler", () => {
    const e = createEmitter();
    const spy = vi.fn();
    const off = e.on("foo", spy);
    off();
    e.emit("foo", { path: "foo", value: 1, oldValue: undefined });
    expect(spy).not.toHaveBeenCalled();
  });

  it("'*' receives every emit, whatever the path", () => {
    const e = createEmitter();
    const seen: string[] = [];
    e.on("*", () => seen.push("any"));
    e.emit("foo", { path: "foo", value: 1, oldValue: undefined });
    e.emit("bar.baz", { path: "bar.baz", value: 2, oldValue: undefined });
    expect(seen).toEqual(["any", "any"]);
  });
});
