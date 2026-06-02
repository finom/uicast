import { describe, expect, it, vi } from "vitest";
import { createEmitter, createReactiveProxy } from "./createReactiveProxy";

describe("createReactiveProxy — reads", () => {
  it("returns the same proxy reference for the same source object", () => {
    const state = createReactiveProxy({ user: { name: "Ada" } });
    expect(state.user).toBe(state.user);
  });

  it("returns raw values for primitives", () => {
    const state = createReactiveProxy({ count: 0 });
    expect(state.count).toBe(0);
  });

  it("exposes $emitter / $set / $setDefault on the root only", () => {
    const state = createReactiveProxy({ nested: { a: 1 } });
    expect(typeof state.$emitter).toBe("object");
    expect(typeof state.$set).toBe("function");
    expect(typeof state.$setDefault).toBe("function");
    // Sub-proxies should NOT expose root-only hooks
    expect((state.nested as unknown as { $emitter?: unknown }).$emitter).toBe(
      undefined,
    );
  });
});

describe("createReactiveProxy — writes and emits", () => {
  it("emits on direct property assignment", () => {
    const state = createReactiveProxy<{ count: number }>({ count: 0 });
    const spy = vi.fn();
    state.$emitter.on("count", spy);
    state.count = 1;
    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith({ path: "count", value: 1, oldValue: 0 });
  });

  it("emits at the full dotted path for nested writes", () => {
    const state = createReactiveProxy<{ user: { name: string } }>({
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
    const state = createReactiveProxy<{ count: number }>({ count: 5 });
    const spy = vi.fn();
    state.$emitter.on("count", spy);
    state.count = 5;
    expect(spy).not.toHaveBeenCalled();
  });

  it("subscribes path-exact — parent subscriber does NOT see child writes", () => {
    const state = createReactiveProxy<{ rows: { name: string }[] }>({
      rows: [{ name: "first" }],
    });
    const parentSpy = vi.fn();
    state.$emitter.on("rows", parentSpy);
    state.rows[0].name = "renamed";
    expect(parentSpy).not.toHaveBeenCalled();
  });

  it("subscribes path-exact — child subscriber sees only matching writes", () => {
    const state = createReactiveProxy<{ rows: { name: string }[] }>({
      rows: [{ name: "first" }],
    });
    const childSpy = vi.fn();
    state.$emitter.on("rows.0.name", childSpy);
    state.rows[0].name = "renamed";
    expect(childSpy).toHaveBeenCalledOnce();
  });
});

describe("createReactiveProxy — $set / $setDefault", () => {
  it("$set walks dotted segments, creating intermediates", () => {
    const state = createReactiveProxy<{ a?: { b?: { c?: string } } }>({});
    state.$set("a.b.c", "hello");
    expect(state.a?.b?.c).toBe("hello");
  });

  it("$setDefault only writes when the leaf is undefined", () => {
    const state = createReactiveProxy<{ count?: number }>({});
    state.$setDefault("count", 1);
    expect(state.count).toBe(1);
    state.$setDefault("count", 99);
    expect(state.count).toBe(1);
  });
});

describe("createReactiveProxy — emitter unsubscribe", () => {
  it("on() returns an unsubscribe function", () => {
    const state = createReactiveProxy<{ count: number }>({ count: 0 });
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
