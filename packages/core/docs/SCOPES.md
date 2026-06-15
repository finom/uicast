# Scopes — `createProxyScope`

Scopes are the render runtime's state model. This document has two halves: **Usage** — the scope architecture an element author (or LLM) works against — then the **low-level API** of the proxy that backs each scope. Read [`SPEC.md`](./SPEC.md) for the normative format contract (scopes are §1.5), [`OVERVIEW.md`](./OVERVIEW.md) for how the engine subscribes to scope changes (and [`REACT.md`](./REACT.md) for how the React binding wires that to re-renders); read this for what a scope *is* and how the proxy underneath behaves.

---

## Usage — the scope architecture

### Scopes are a flat, named bag

Expressions see one variable, `scopes`. It is a flat map of **named scopes** — never a deep tree of scopes:

```
scopes.<scopeName>.<path>        // e.g. scopes.root.searchTerm
```

`parseScope` splits on the first dot: the first segment is the **scope name**, everything after is a path *within* that scope. Each named scope is one independent `createProxyScope` instance with its own data; scopes don't nest as objects. Lexical nesting is expressed by **naming and composition**, not by `scopes.a.b.c.d`.

- **`scopes.root`** is always present — the page-wide scope. App-level state (filters, active tab, open modals) lives here.

### Item scopes — created per list item

A list element declares `each` (an expression returning an array) and `as` (a globally-unique name). For **each item**, the renderer:

1. builds a scope proxy over `{ item, index, id }` (reused across re-renders, keyed by the item's id), then
2. hands that item's subtree a **merged bag** — the parent's scopes plus the item's own, keyed by the list's `as`:

```ts
const itemScopes = {
  ...scopes,             // everything the parent subtree could already see
  [line.as]: itemProxy,  // this item's scope, named by the list
};
```

So inside a row, expressions read the parent scopes **and** `scopes.<as>` — where `scopes.<as>.item` is the row record, `.index` its position, `.id` its stable key. This is ordinary lexical scoping: inner subtrees see outer scopes, and a **nested list** stacks another `[innerAs]` onto the same bag, so a deeply nested row sees `root` + every enclosing item scope.

Two consequences worth internalizing:

- **A list is N scope instances, not one.** Each rendered row gets its own proxy, so per-row local state (`scopes.<as>.expanded = true`) is genuinely per-row — no index juggling, no collisions between rows.
- **The parent reaches every row via `childScopes`.** After rendering, the list writes the array of live item proxies to `childScopes.<as>` on the parent scope, so cross-row aggregates ("sum every row's qty") can read across instances.

### The mental model — lexical scopes

Start from the elements. This array is the orders → lines screen — `component` names are illustrative, and on the wire it streams as JSONL (one object per line). There's no `op` field: `page` is the root because no other element lists it in a `children` array.

```json
[
  { "key": "page", "component": "Stack", "children": ["search", "orders"] },

  { "key": "search", "component": "Input",
    "props": { "expr": "({ value: scopes.root.searchTerm })" },
    "callbacks": { "onChange": [{ "set": "scopes.root.searchTerm", "expr": "evt.value" }] } },

  { "key": "orders", "component": "OrderCard",
    "each": "scopes.root.orders", "as": "order", "keyBy": "id",
    "children": ["order-title", "lines"] },

  { "key": "order-title", "component": "Text",
    "props": { "expr": "({ text: scopes.order.item.customer })" } },

  { "key": "lines", "component": "LineRow",
    "each": "scopes.order.item.lines", "as": "line",
    "children": ["line-text"] },

  { "key": "line-text", "component": "Text",
    "props": { "expr": "({ text: scopes.line.item.sku })" } }
]
```

Which means, in plain lexical-scoping terms: each list element (an element carrying `each`) introduces a new **named scope**, exactly like a block introduces locals — except the nesting is captured by scope *name*, not by nesting one scope object inside another.

```js
// imperative analogy                  // scope path it maps to
let searchTerm = "shoes";              // scopes.root.searchTerm

// as = "order", keyBy = "id"
// each = "scopes.root.orders" — an expression, evaluated to this array:
orders.forEach((order, index) => {
  const id = order.id ?? index;          // keyBy "id" → order.id, falling back to index
  // the engine wraps each row as scope "order" = { item: order, index, id }:
  //   scopes.order.item   = order        (the row record)
  //   scopes.order.index  = index        (array position)
  //   scopes.order.id     = id           (stable key, used to reconcile rows across renders)
  let expanded = false;                  // scopes.order.expanded   (per-row local state)
  // visible here: scopes.root.*, scopes.order.*

  // as = "line" (no keyBy → defaults to "_index")
  // each = "scopes.order.item.lines" — evaluated to this order's lines:
  order.lines.forEach((line, index) => {
    const id = index;                    // "_index" → id is the position; "_item" would use line itself
    // scope "line" = { item: line, index, id }:
    //   scopes.line.item = line
    // visible here: scopes.root.*, scopes.order.*, scopes.line.*
  });
});
```

`search` reads/writes `scopes.root.searchTerm` (the top-level `let`); the two list elements (those carrying `each`) are the two `forEach`s; `as` names each row's scope; `order-title` / `line-text` read `scopes.order.item` / `scopes.line.item`.

Concretely, the `scopes` bag handed to the **innermost** subtree is the merge of every enclosing scope:

```ts
// what an expression inside a `line` row sees as `scopes`:
{
  root:  { searchTerm, /* …root state… */, childScopes: { order: [/* one scope per order row */] } },
  order: { item, index, id, expanded, childScopes: { line: [/* one scope per line in THIS order */] } },
  line:  { item, index, id },              // this line row (no nested list, so no childScopes)
}
```

Each `order` row and each `line` row is its **own** proxy instance — so `scopes.order.expanded` is independent per row, with no index juggling.

And the engine collects every iteration's scope onto the **enclosing** scope as `childScopes.<as>`, so a parent can read across all of its rows:

```js
// from the page — root sees the collected order rows:
scopes.root.childScopes.order;  // [ { item, index, id, expanded }, … ]  one per order row

scopes.root.childScopes.order.reduce((s, o) => s + o.item.total, 0); // grand total
scopes.root.childScopes.order.filter((o) => o.expanded).length;      // how many are open

// from inside an order row — where scopes.order is visible:
scopes.order.childScopes.line;  // [ { item, index, id }, … ]  the lines of THIS order

// each entry in childScopes.order is itself a full scope, so the chain keeps
// going — reach any line of any order from the page, no scopes.order/scopes.line
// needed in the expression:
scopes.root.childScopes.order[0].childScopes.line[0].item.sku; // first line of the first order
```

Note the nesting mirrors visibility: `childScopes.order` lives on `root`, but `childScopes.line` lives on each `order` scope (every order has its own lines), reachable either where `scopes.order` is in scope or by descending the chain `scopes.root.childScopes.order[i].childScopes.line[j]`.

### Writes & reactivity (summary)

- Reads are plain property access. **Writes** — either direct assignment (`scopes.root.x = 1`) or `$set` called on the scope proxy (`scopes.root.$set("x", 1)`) — emit on the **exact** dotted path that changed.
- Subscriptions are **path-exact**: a reader of `scopes.inv.rows` is *not* woken by a write to `scopes.inv.rows.0.qty`, and vice-versa. The runtime convention is to replace arrays/objects wholesale so the intended parent readers wake.
- The mechanics — the proxy, the emitter, `$set`, identity, performance — are below.

---

## The proxy — low-level API

This half describes the proxy primitive that backs each scope. **It exists for one purpose: state management** — a purpose-built reactive store, in the same role as Zustand/Redux/MobX, just scoped to this engine's needs. It's a self-contained, ~140-line library: a JavaScript Proxy over an arbitrary object plus a path-keyed event emitter. It is independent of the element model and the React renderer — if you only need a fine-grained reactive object you can use `createProxyScope` on its own.

### The shape

```ts
import { createProxyScope } from "@ui-fired/core";

const state = createProxyScope({
  count: 0,
  user: { name: "Ada", roles: ["admin"] },
});
```

`state` is a Proxy over the input object. It exposes two framework hooks **at the root only**:

- `state.$emitter` — the path-keyed event emitter (subscriptions live here).
- `state.$set(path, value, options?)` — write through the proxy by dotted path; creates intermediate objects on the way. Pass `{ default: true }` to assign only if the leaf is currently `undefined` (init-if-absent).

Sub-proxies (`state.user`, `state.user.roles`, etc.) don't expose `$emitter` / `$set`. Emits go to the **root** scope's shared emitter because the emitter is captured in the closure used by every sub-proxy's `set` trap.

### Reads

Every property access returns a proxy if the value is an object, otherwise the raw value:

```ts
const u = state.user;         // proxy over { name, roles }
const n = state.user.name;    // "Ada" (raw string, no proxy)
const r = state.user.roles;   // proxy over ["admin"]
```

Reads are recursive — each `get` trap re-wraps the value, with a `proxyCache: WeakMap<object, object>` ensuring identity stability: the **same source object always returns the same proxy reference**. Subscribers can compare proxies by reference across re-renders without spurious churn.

The recursive wrapping exists so that **nested writes emit**: a single root Proxy can't intercept `state.user.name = x` (reading `state.user` would hand back the raw object and the write would bypass the trap). Wrapping each level on the way down is what makes deep assignment — and `$set` to a deep path — fire the `set` trap at the right node.

The `get` trap also respects the JavaScript invariant for non-configurable, non-writable properties — it returns the raw target value in that case, so frozen objects don't crash inside the proxy.

### Writes

```ts
state.count = 1;                            // direct property assignment
state.$set("user.name", "Grace");           // dotted-path assignment
state.$set("user.lastLogin", new Date(), { default: true });  // only if undefined
```

Each write fires through the `set` trap. The trap:

1. Reads the previous value at the property.
2. Writes the new value via `Reflect.set`.
3. If `oldValue !== value`, emits on the **full dotted path** of the assigned property.

```ts
const fullPath = path.concat(prop).join(".");
emitter.emit(fullPath, { path: fullPath, value, oldValue });
```

The emit happens **after** the write completes, so subscribers reading current state see the new value.

#### Idempotence

`set` checks `oldValue !== value` before emitting. Writing the same primitive twice produces zero events. (Object identity matters — writing a new object literal with structurally identical contents is a different reference and will emit.)

#### `$set` semantics

`$set(path, value)` walks the dotted segments:

```ts
state.$set("user.address.city", "Berlin");
```

If `user` exists but `user.address` is `undefined` (or `null`), `$set` creates an empty object at `user.address`, then assigns `city`. Each intermediate assignment goes through the `set` trap and emits at its own path — so a single `$set("a.b.c", v)` on a fresh tree emits at `a`, then `a.b`, then `a.b.c` (in that order).

If you need set-only-if-missing, pass `{ default: true }` to `$set`. It walks the same way but the leaf assignment is skipped when `current[lastKey] !== undefined`. This is how `defaults` are applied (first-writer-wins), so two components seeding the same path don't clobber each other.

### The emitter

```ts
interface Emitter {
  on<T>(type: string, handler: (payload: T) => void): () => void;
  off<T>(type: string, handler: (payload: T) => void): void;
  emit<T>(type: string, payload: T): void;
}
```

`events: Map<string, Set<handler>>`. Subscriptions are **path-exact** — there is no prefix bubbling.

```ts
state.$emitter.on("user.name", (payload) => console.log(payload.value));
state.$set("user.name", "Hopper");   // logs "Hopper"
state.$set("user.roles", ["admin"]); // no log — different path
```

This is the single most important consequence to internalize:

> **`emit("rows.0.name", …)` only fires handlers registered via `on("rows.0.name", …)`.**
> Subscribing to `"rows"` does *not* catch a write at `"rows.0.name"`.

Reader-writer agreement is by **path equality**. The runtime never tries to bubble or fan out by prefix.

#### Implications for writer style

- **Granular writes wake granular readers, not coarse ones.** `state.$set("rows.0.name", "x")` wakes a subscriber on `"rows.0.name"` but **not** a subscriber on `"rows"`.
- **Coarse writes wake coarse readers, not granular ones.** `state.$set("rows", newArr)` wakes a subscriber on `"rows"` but **not** a subscriber on `"rows.0.name"` (even if the new array has a different name at index 0).

The convention in core's render runtime is to **replace arrays / objects wholesale** in callbacks so any reader of the parent path wakes. If you use this primitive standalone, decide a convention up front — readers must subscribe to the exact path the writers will emit on.

#### `on` returns an unsubscribe

```ts
const off = state.$emitter.on("count", handleCount);
// later:
off();   // detaches the handler
```

The function is idempotent — calling it multiple times has no effect after the first.

### API reference

```ts
function createProxyScope<T extends object>(target?: T): T & {
  $emitter: Emitter;
  $set: (path: string, value: unknown, options?: { default?: boolean }) => void;
};
```

- **`target`** (optional) — the initial state. Defaults to `{}`. Mutates in place via the Proxy; if you want to keep the input untouched, clone it before passing.
- Return type adds `$emitter`, `$set` to the input type. Use these only on the root.

```ts
interface ChangePayload<T = unknown> {
  path: string;     // the full dotted path that was written
  value: T;         // the new value
  oldValue: T;      // the previous value
}
```

Subscribers receive this payload object on every emit.

```ts
interface Emitter {
  on<T = unknown>(type: string, handler: (payload: T) => void): () => void;
  off<T = unknown>(type: string, handler: (payload: T) => void): void;
  emit<T = unknown>(type: string, payload: T): void;
}
```

`on` returns an unsubscribe function. `emit` is what the `set` trap calls; you generally don't call it directly unless you're building your own write helpers.

### Performance notes

- **proxyCache** is a `WeakMap<object, object>`. Same source object → same proxy reference. Cheap subscribe / unsubscribe across re-renders because handler-set membership is by reference; you can also use proxy refs as React keys without churn.
- **Event lookup** is O(1) — a `Map.get(path)` followed by `Set.forEach(handler => handler(payload))`. There's no walk over a subscriber list trying to match prefixes.
- **No virtual-DOM diffing.** The proxy emits exactly one event per write. Consumers wake exactly when they should.
- **Memory bound** — the `proxyCache` and the emitter's `events` Map both grow as new paths are touched. Both are bounded by the size of the underlying state tree (proxyCache) or by the active subscriber set (emitter). In long-running apps, unsubscribe handlers when their owners unmount.

---

## Cross-references

- [`OVERVIEW.md`](./OVERVIEW.md) — the render runtime that uses these scopes to build per-list-item state and reactive component trees.
- [`create-proxy-scope.ts`](../src/scope/create-proxy-scope.ts) — the source. Short enough to read in one sitting.
- [`../src/utils/utils.ts`](../src/utils/utils.ts) — `parseScope(key)` — splits a `"scopes.X.Y"` dep string into `[scopeName, leafPath]` for emitter subscription.
