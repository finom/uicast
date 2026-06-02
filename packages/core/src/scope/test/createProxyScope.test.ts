import { describe, expect, it, vi } from "vitest";
import { createEmitter, createProxyScope } from "../createProxyScope";

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
});

describe("createProxyScope — $set", () => {
  it("$set walks dotted segments, creating intermediates", () => {
    const state = createProxyScope<{ a?: { b?: { c?: string } } }>({});
    state.$set("a.b.c", "hello");
    expect(state.a?.b?.c).toBe("hello");
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
    e.emit("foo", { v: 1 });
    expect(a).toHaveBeenCalledWith({ v: 1 });
    expect(b).toHaveBeenCalledWith({ v: 1 });
  });

  it("off() detaches the handler", () => {
    const e = createEmitter();
    const spy = vi.fn();
    e.on("foo", spy);
    e.off("foo", spy);
    e.emit("foo", 1);
    expect(spy).not.toHaveBeenCalled();
  });
});
