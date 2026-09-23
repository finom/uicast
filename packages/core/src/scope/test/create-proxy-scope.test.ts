import { describe, expect, it, vi } from "vitest";
import { EntryError } from "../../entry-error";
import { createProxyScope, createRowScope, getForwardTargets } from "../create-proxy-scope";

describe("createProxyScope — reads", () => {
  it("reads fields as plain values, nested objects included", () => {
    const state = createProxyScope({ count: 0, user: { name: "Ada" } });
    expect(state.count).toBe(0);
    expect(state.user).toBe(state.user);
    expect(Object.isFrozen(state.user)).toBe(false);
  });

  it("exposes $$emitter and $$set", () => {
    const state = createProxyScope({});
    expect(typeof state.$$emitter).toBe("object");
    expect(typeof state.$$set).toBe("function");
  });
});

describe("createProxyScope — writes", () => {
  it("emits the field on assignment", () => {
    const state = createProxyScope<{ count: number }>({ count: 0 });
    const spy = vi.fn();
    state.$$emitter.on("count", spy);
    state.count = 1;
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("a nested assignment is a plain write: nothing emits", () => {
    const state = createProxyScope<{ user: { name: string } }>({ user: { name: "Ada" } });
    const spy = vi.fn();
    state.$$emitter.on("user", spy);
    state.user.name = "Hopper";
    expect(state.user.name).toBe("Hopper");
    expect(spy).not.toHaveBeenCalled();
    expect(state.$$emitter.version).toBe(0);
  });

  it("does not emit a same-value write", () => {
    const state = createProxyScope<{ count: number }>({ count: 5 });
    const spy = vi.fn();
    state.$$emitter.on("count", spy);
    state.count = 5;
    expect(spy).not.toHaveBeenCalled();
    expect(state.$$emitter.version).toBe(0);
  });

  it("a field write wakes only that field's subscribers", () => {
    const state = createProxyScope<{ products: unknown[]; orders: unknown[] }>({ products: [], orders: [] });
    const products = vi.fn();
    const orders = vi.fn();
    state.$$emitter.on("products", products);
    state.$$emitter.on("orders", orders);
    state.$$set("products", [1]);
    expect(products).toHaveBeenCalledOnce();
    expect(orders).not.toHaveBeenCalled();
  });

  it("$$set with { default: true } writes only while the field is undefined", () => {
    const state = createProxyScope<{ count?: number; x: null | number }>({ x: null });
    state.$$set("count", 1, { default: true });
    state.$$set("count", 99, { default: true });
    expect(state.count).toBe(1);
    state.$$set("x", 5, { default: true });
    expect(state.x).toBeNull();
    state.$$set("count", 99);
    expect(state.count).toBe(99);
  });

  it("$$set refuses a dotted field and a prototype key", () => {
    const state = createProxyScope<Record<string, unknown>>({});
    expect(() => state.$$set("a.b", 1)).toThrow(/has no dots/);
    expect(() => state.$$set("__proto__", {})).toThrow(/prototype chain/);
    expect(Object.getPrototypeOf(state)).toBe(Object.prototype);
  });

  it("version counts real writes", () => {
    const state = createProxyScope<{ a: number; b: number }>({ a: 1, b: 1 });
    state.a = 2;
    state.b = 2;
    expect(state.$$emitter.version).toBe(2);
  });
});

describe("createRowScope", () => {
  // A row over `element`, held by `root.rows` so writes have somewhere to land.
  const row = (element: unknown, index = 0, id: string | number = "a") => {
    const scope = createRowScope();
    scope.retarget(element, index, id);
    scope.see({ root: createProxyScope({ rows: [element] }) });
    return scope;
  };

  it("reads the element's fields and the runtime's", () => {
    const { proxy } = row({ name: "Ada", qty: 2 }, 3, "a");
    expect(proxy.name).toBe("Ada");
    expect(proxy.$$index).toBe(3);
    expect(proxy.$$id).toBe("a");
    expect(proxy.$$value).toBeUndefined();
    expect("name" in proxy).toBe(true);
    expect("$$index" in proxy).toBe(true);
    expect("toString" in proxy).toBe(false);
  });

  it("reports runtime fields as own enumerable data, so a spread sees them", () => {
    const { proxy } = row({ name: "Ada" }, 1, 7);
    expect({ ...proxy }).toEqual({ name: "Ada", $$index: 1, $$id: 7 });
    expect(Object.hasOwn(proxy, "$$id")).toBe(true);
    expect(Object.getOwnPropertyDescriptor(proxy, "$$id")).toMatchObject({ writable: false, enumerable: true });
  });

  it("a primitive element reads through $$value and refuses writes", () => {
    const { proxy } = row("blue", 0, 0);
    expect(proxy.$$value).toBe("blue");
    expect({ ...proxy }).toEqual({ $$index: 0, $$id: 0, $$value: "blue" });
    expect(() => proxy.$$set("x", 1)).toThrow(/holds a string/);
    expect(row(null).proxy.$$value).toBeNull();
  });

  it("writes the element in place and emits the field", () => {
    const element = { qty: 1 };
    const scope = row(element);
    const spy = vi.fn();
    scope.proxy.$$emitter.on("qty", spy);
    scope.proxy.$$set("qty", 2);
    expect(element.qty).toBe(2);
    expect(spy).toHaveBeenCalledTimes(1);
    scope.proxy.qty = 3;
    expect(element.qty).toBe(3);
  });

  it("a write emits on every field holding the element, and a holding row forwards again", () => {
    const lineElement = { qty: 1 };
    const orderElement = { lines: [lineElement] };
    const root = createProxyScope({ orders: [orderElement], selected: [orderElement], other: [] });
    const order = createRowScope();
    order.retarget(orderElement, 0, 1);
    order.see({ root });
    const line = createRowScope();
    line.retarget(lineElement, 0, 0);
    line.see({ root, order: order.proxy });
    const spy = vi.fn();
    for (const field of ["orders", "selected", "other"]) root.$$emitter.on(field, () => spy(field));
    order.proxy.$$emitter.on("lines", () => spy("lines"));

    line.proxy.$$set("qty", 2);
    expect(spy.mock.calls.map((c) => c[0])).toEqual(["lines", "orders", "selected"]);
    expect(getForwardTargets(line.proxy)).toEqual([{ scope: order.proxy, field: "lines" }]);
    expect(getForwardTargets(root)).toEqual([]);
  });

  it("finds the element as a field value, in an array of arrays, among an object's values, and in an object of arrays", () => {
    const element = { n: 1 };
    const root = createProxyScope({ one: element, grid: [[element]], byId: { a: element }, byGroup: { g: [element] } });
    const scope = createRowScope();
    scope.retarget(element, 0, 0);
    scope.see({ root });
    expect(getForwardTargets(scope.proxy).map((t) => t.field)).toEqual(["one", "grid", "byId", "byGroup"]);
  });

  it("refuses a write when no scope field holds the element, and after detach", () => {
    const orphan = createRowScope();
    orphan.retarget({ qty: 1 }, 0, 0);
    orphan.see({ root: createProxyScope({ rows: [{ qty: 1 }] }) });
    expect(() => orphan.proxy.$$set("qty", 2)).toThrow(/built a new object/);

    const dropped = row({ qty: 1 });
    dropped.detach();
    try {
      dropped.proxy.$$set("qty", 2);
      expect.unreachable();
    } catch (err) {
      expect(EntryError.is(err) && err.reason).toBe("unknown-reference");
    }
    expect(dropped.proxy.qty).toBe(1);
  });

  it("a write through one window wakes every other window onto the same element", () => {
    const element = { n: 1 };
    const root = createProxyScope({ items: [element] });
    const a = createRowScope();
    const b = createRowScope();
    for (const w of [a, b]) {
      w.retarget(element, 0, 0);
      w.see({ root });
    }
    const spy = vi.fn();
    b.proxy.$$emitter.on("n", spy);
    a.proxy.$$set("n", 2);
    expect(spy).toHaveBeenCalledOnce();
    b.detach();
    a.proxy.$$set("n", 3);
    expect(spy).toHaveBeenCalledOnce();
  });

  it("retarget is silent and re-points the window", () => {
    const scope = row({ qty: 1 });
    const spy = vi.fn();
    scope.proxy.$$emitter.on("*", spy);
    scope.retarget({ qty: 9 }, 5, "z");
    expect(scope.proxy.qty).toBe(9);
    expect(scope.proxy.$$index).toBe(5);
    expect(spy).not.toHaveBeenCalled();
  });

  it("refuses the runtime's fields and prototype keys", () => {
    const { proxy } = row({});
    for (const field of ["$$id", "$$index", "$$value"]) {
      expect(() => proxy.$$set(field, 1)).toThrow(/runtime owns/);
    }
    expect(() => proxy.$$set("__proto__", {})).toThrow(/prototype chain/);
    proxy.$$set("$draft", 1);
    expect(proxy.$draft).toBe(1);
  });

  it("a frozen element fails classified", () => {
    const { proxy } = row(Object.freeze({ qty: 1 }));
    try {
      proxy.$$set("qty", 2);
      expect.unreachable();
    } catch (err) {
      expect(EntryError.is(err) && err.reason).toBe("expression-runtime");
    }
  });

  it("an element that is an array reads by index and length", () => {
    const { proxy } = row([10, 20]);
    expect(proxy[0]).toBe(10);
    expect(proxy.length).toBe(2);
    expect(Object.keys(proxy)).toEqual(["0", "1", "$$index", "$$id"]);
  });
});

describe("createProxyScope — $$emitter", () => {
  it("emits to every handler of a field, and to '*'", () => {
    const e = createProxyScope({}).$$emitter;
    const a = vi.fn();
    const any = vi.fn();
    e.on("foo", a);
    e.on("*", any);
    e.emit("foo");
    e.emit("bar");
    expect(a).toHaveBeenCalledTimes(1);
    expect(any).toHaveBeenCalledTimes(2);
  });

  it("on() returns an unsubscribe function", () => {
    const e = createProxyScope({}).$$emitter;
    const spy = vi.fn();
    e.on("foo", spy)();
    e.emit("foo");
    expect(spy).not.toHaveBeenCalled();
  });
});
