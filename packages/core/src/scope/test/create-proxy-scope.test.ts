import { describe, expect, it, vi } from "vitest";
import { EntryError } from "../../entry-error";
import { countEmits, createProxyScope, createRowScope, createRowState, getForwardTargets } from "../create-proxy-scope";

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
    expect(countEmits(state)).toBe(0);
  });

  it("does not emit a same-value write", () => {
    const state = createProxyScope<{ count: number }>({ count: 5 });
    const spy = vi.fn();
    state.$$emitter.on("count", spy);
    state.count = 5;
    expect(spy).not.toHaveBeenCalled();
    expect(countEmits(state)).toBe(0);
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

  it("countEmits counts real writes", () => {
    const state = createProxyScope<{ a: number; b: number }>({ a: 1, b: 1 });
    state.a = 2;
    state.b = 2;
    expect(countEmits(state)).toBe(2);
  });
});

describe("createRowScope", () => {
  // A row over `element`, from a list whose `each` reads `root.rows`.
  const row = (element: unknown) => {
    const root = createProxyScope<Record<string, unknown>>({ rows: [element] });
    const scope = createRowScope();
    scope.retarget(element);
    scope.see({ root }, ["scopes.root.rows"]);
    return Object.assign(scope, { root });
  };

  it("reads the element's fields and nothing else", () => {
    const { proxy } = row({ name: "Ada", qty: 2 });
    expect(proxy.name).toBe("Ada");
    expect(proxy.index).toBeUndefined();
    expect("name" in proxy).toBe(true);
    expect("toString" in proxy).toBe(false);
  });

  it("a copy of the row is the element", () => {
    const { proxy } = row({ name: "Ada" });
    expect({ ...proxy }).toEqual({ name: "Ada" });
    expect(Object.keys(proxy)).toEqual(["name"]);
    expect(JSON.stringify(proxy)).toBe('{"name":"Ada"}');
  });

  it("a primitive or array element has no writable fields", () => {
    expect(() => row("blue").proxy.$$set("x", 1)).toThrow(/holds a string/);
    expect(() => row([1]).proxy.$$set("x", 1)).toThrow(/holds an array/);
  });

  it("a write puts a copy in a new source array, changes nothing in place, and emits", () => {
    const element = { qty: 1 };
    const scope = row(element);
    const rows = scope.root.rows;
    const spy = vi.fn();
    scope.proxy.$$emitter.on("qty", () => spy("qty"));
    scope.root.$$emitter.on("rows", () => spy("rows"));
    scope.proxy.$$set("qty", 2);
    expect(element.qty).toBe(1);
    expect(rows).toEqual([{ qty: 1 }]);
    expect(scope.root.rows).toEqual([{ qty: 2 }]);
    expect(scope.proxy.qty).toBe(2);
    expect(spy.mock.calls.flat()).toEqual(["rows", "qty"]);
    scope.proxy.qty = 3;
    expect(scope.root.rows).toEqual([{ qty: 3 }]);
  });

  it("the row's own write already moved it; a new item from elsewhere moves it", () => {
    const scope = row({ qty: 1 });
    scope.proxy.$$set("qty", 2);
    expect(scope.retarget((scope.root.rows as unknown[])[0])).toBe(false);
    expect(scope.retarget({ qty: 9 })).toBe(true);
    expect(scope.proxy.qty).toBe(9);
  });

  it("a frozen item is copied, never changed", () => {
    const element = Object.freeze({ qty: 1 });
    const scope = row(element);
    scope.proxy.$$set("qty", 2);
    expect(scope.root.rows).toEqual([{ qty: 2 }]);
    expect(element.qty).toBe(1);
  });

  it("a nested write climbs: the line's copy lands in a new `order.lines`, the order's in a new `root.orders`", () => {
    const lineElement = { qty: 1 };
    const orderElement = { id: "A", lines: [lineElement, { qty: 5 }] };
    const other = { id: "B", lines: [] };
    const root = createProxyScope<Record<string, unknown>>({ orders: [orderElement, other] });
    const order = createRowScope();
    order.retarget(orderElement);
    order.see({ root }, ["scopes.root.orders"]);
    const line = createRowScope();
    line.retarget(lineElement);
    line.see({ root, order: order.proxy }, ["scopes.order.lines"]);
    const spy = vi.fn();
    root.$$emitter.on("orders", () => spy("orders"));
    order.proxy.$$emitter.on("lines", () => spy("lines"));

    line.proxy.$$set("qty", 2);
    expect(root.orders).toEqual([{ id: "A", lines: [{ qty: 2 }, { qty: 5 }] }, other]);
    expect((root.orders as unknown[])[1]).toBe(other);
    expect(orderElement.lines[0]).toBe(lineElement);
    expect(lineElement.qty).toBe(1);
    expect(order.proxy.lines).toBe((root.orders as { lines: unknown }[])[0].lines);
    expect(spy.mock.calls.flat()).toEqual(["orders", "lines"]);
    expect(getForwardTargets(line.proxy)).toEqual([{ scope: order.proxy, field: "lines" }]);
    expect(getForwardTargets(order.proxy)).toEqual([{ scope: root, field: "orders" }]);
    expect(getForwardTargets(root)).toEqual([]);
  });

  it("finds the item where `each` reads it: the field itself, a group of arrays, below a path, inside `flatMap`", () => {
    const element = { n: 1 };
    const cases: [Record<string, unknown>, string, (root: Record<string, unknown>) => unknown][] = [
      [{ one: element }, "scopes.root.one", (r) => r.one],
      [{ groups: { a: [], b: [element] } }, "scopes.root.groups", (r) => (r.groups as { b: unknown[] }).b[0]],
      [{ data: { catalog: { items: [element] } } }, "scopes.root.data.catalog.items", (r) => r.data],
      [{ orders: [{ lines: [element] }] }, "scopes.root.orders", (r) => r.orders],
    ];
    for (const [fields, read, pick] of cases) {
      const root = createProxyScope<Record<string, unknown>>(fields);
      const scope = createRowScope();
      scope.retarget(element);
      scope.see({ root }, [read]);
      scope.proxy.$$set("n", 2);
      expect(JSON.stringify(pick(root)), read).toContain('"n":2');
      expect(element.n).toBe(1);
    }
  });

  it("finds the item at any depth, and a source that points back to itself ends the search", () => {
    const element = { n: 1 };
    const deep = createProxyScope<Record<string, unknown>>({ a: { b: { c: { d: { e: [element] } } } } });
    const found = createRowScope();
    found.retarget(element);
    found.see({ root: deep }, ["scopes.root.a"]);
    found.proxy.$$set("n", 2);
    expect(JSON.stringify(deep.a)).toBe('{"b":{"c":{"d":{"e":[{"n":2}]}}}}');

    const loop: Record<string, unknown> = { rows: [] };
    loop.self = loop;
    const cyclic = createRowScope();
    cyclic.retarget({ n: 1 });
    cyclic.see({ root: createProxyScope({ loop }) }, ["scopes.root.loop"]);
    expect(() => cyclic.proxy.$$set("n", 2)).toThrow(/built a new object/);
  });

  it("skips what `each` reads that does not hold the item", () => {
    const element = { n: 1 };
    const root = createProxyScope<Record<string, unknown>>({ q: "x", rows: [element] });
    const scope = createRowScope();
    scope.retarget(element);
    scope.see({ root }, ["scopes.root.q", "scopes.nope.rows", "scopes.root", "scopes.root.rows"]);
    scope.proxy.$$set("n", 2);
    expect(root.q).toBe("x");
    expect(root.rows).toEqual([{ n: 2 }]);
  });

  it("refuses a write when nothing `each` reads holds the item, and after detach", () => {
    const orphan = createRowScope();
    orphan.retarget({ qty: 1 });
    orphan.see({ root: createProxyScope({ rows: [{ qty: 1 }] }) }, ["scopes.root.rows"]);
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

  it("two writes in a row build on each other", () => {
    const scope = row({ a: 1, b: 1 });
    scope.proxy.$$set("a", 2);
    scope.proxy.$$set("b", 2);
    expect(scope.root.rows).toEqual([{ a: 2, b: 2 }]);
  });

  it("replaces every copy of the item in the source", () => {
    const element = { n: 1 };
    const root = createProxyScope<Record<string, unknown>>({ rows: [element, element] });
    const scope = createRowScope();
    scope.retarget(element);
    scope.see({ root }, ["scopes.root.rows"]);
    scope.proxy.$$set("n", 2);
    expect(root.rows).toEqual([{ n: 2 }, { n: 2 }]);
  });

  it("retarget is silent", () => {
    const scope = row({ qty: 1 });
    const spy = vi.fn();
    scope.proxy.$$emitter.on("*", spy);
    scope.retarget({ qty: 9 });
    expect(scope.proxy.qty).toBe(9);
    expect(spy).not.toHaveBeenCalled();
  });

  it("refuses prototype keys; every other name is the element's", () => {
    const { proxy } = row({});
    expect(() => proxy.$$set("__proto__", {})).toThrow(/prototype chain/);
    proxy.$$set("index", 1);
    expect(proxy.index).toBe(1);
  });

  it("an element that is an array reads by index and length", () => {
    const { proxy } = row([10, 20]);
    expect(proxy[0]).toBe(10);
    expect(proxy.length).toBe(2);
    expect(Object.keys(proxy)).toEqual(["0", "1"]);
  });
});

describe("createRowState", () => {
  const state = (element: unknown, index = 0, id: string | number = "a") => {
    const scope = createRowState();
    scope.retarget(element, index, id);
    return scope;
  };

  it("reads the runtime's index, id and value", () => {
    const { proxy } = state({ name: "Ada" }, 3, "a");
    expect(proxy.index).toBe(3);
    expect(proxy.id).toBe("a");
    expect(proxy.value).toBeUndefined();
    expect(proxy.name).toBeUndefined();
    expect(state("blue").proxy.value).toBe("blue");
    expect(state(null).proxy.value).toBeNull();
  });

  it("keeps the runtime's fields out of a copy", () => {
    const { proxy } = state({}, 1, 7);
    expect({ ...proxy }).toEqual({});
    proxy.$$set("open", true);
    expect({ ...proxy }).toEqual({ open: true });
    expect(Object.hasOwn(proxy, "id")).toBe(true);
    expect(Object.getOwnPropertyDescriptor(proxy, "id")).toMatchObject({ writable: false, enumerable: false });
  });

  it("writes its own fields and emits them, and refuses the runtime's", () => {
    const { proxy } = state({});
    const spy = vi.fn();
    proxy.$$emitter.on("open", spy);
    proxy.$$set("open", true);
    proxy.$$set("open", false, { default: true });
    expect(proxy.open).toBe(true);
    proxy.open = false;
    expect(spy).toHaveBeenCalledTimes(2);
    for (const field of ["index", "id", "value"]) {
      try {
        proxy.$$set(field, 1);
        expect.unreachable();
      } catch (err) {
        expect(EntryError.is(err) && err.reason).toBe("guardrail-violation");
      }
    }
    expect(() => proxy.$$set("__proto__", {})).toThrow(/prototype chain/);
  });

  it("retarget is silent", () => {
    const scope = state({}, 0);
    const spy = vi.fn();
    scope.proxy.$$emitter.on("*", spy);
    scope.retarget({}, 4, "b");
    expect(scope.proxy.index).toBe(4);
    expect(spy).not.toHaveBeenCalled();
  });
});

describe("createProxyScope — $$emitter", () => {
  it("calls a field's handlers and every '*' handler", () => {
    const scope = createProxyScope<Record<string, unknown>>({});
    const a = vi.fn();
    const any = vi.fn();
    scope.$$emitter.on("foo", a);
    scope.$$emitter.on("*", any);
    scope.foo = 1;
    scope.bar = 1;
    expect(a).toHaveBeenCalledTimes(1);
    expect(any).toHaveBeenCalledTimes(2);
  });

  it("on() returns an unsubscribe function", () => {
    const scope = createProxyScope<Record<string, unknown>>({});
    const spy = vi.fn();
    scope.$$emitter.on("foo", spy)();
    scope.foo = 1;
    expect(spy).not.toHaveBeenCalled();
  });
});
