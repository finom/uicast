# Reactive state — `createReactiveProxy`

This document describes the proxy-based reactive state library that powers core's chunk runtime. It's a self-contained, ~140-line module: a JavaScript Proxy over an arbitrary object, plus a path-keyed event emitter. Read this first if you want to understand how reads and writes propagate; read [`DSL.md`](./DSL.md) afterwards for how the chunk runtime layers scopes, subscriptions, and rendering on top.

The library is intentionally small and independent from the rest of core. If you only need a fine-grained reactive object — no chunk protocol, no React renderer — you can use `createReactiveProxy` on its own.

---

## 1. The shape

```ts
import { createReactiveProxy } from "core/render/createReactiveProxy";

const state = createReactiveProxy({
  count: 0,
  user: { name: "Ada", roles: ["admin"] },
});
```

`state` is a Proxy over the input object. It exposes three framework hooks **at the root only**:

- `state.$emitter` — the path-keyed event emitter (subscriptions live here).
- `state.$set(path, value)` — write through the proxy by dotted path; creates intermediate objects on the way.
- `state.$setDefault(path, value)` — same as `$set` but only assigns if the leaf is `undefined`.

Sub-proxies (`state.user`, `state.user.roles`, etc.) don't expose `$emitter` / `$set` / `$setDefault`. Emits go to the **root** scope's shared emitter because the emitter is captured in the closure used by every sub-proxy's `set` trap.

---

## 2. Reads

Every property access returns a proxy if the value is an object, otherwise the raw value:

```ts
const u = state.user;         // proxy over { name, roles }
const n = state.user.name;    // "Ada" (raw string, no proxy)
const r = state.user.roles;   // proxy over ["admin"]
```

Reads are recursive — each `get` trap re-wraps the value, with a `proxyCache: WeakMap<object, object>` ensuring identity stability: the **same source object always returns the same proxy reference**. Subscribers can compare proxies by reference across re-renders without spurious churn.

The Proxy `get` trap also respects the JavaScript invariant for non-configurable, non-writable properties — it returns the raw target value in that case, so frozen objects don't crash inside the proxy.

---

## 3. Writes

```ts
state.count = 1;                            // direct property assignment
state.$set("user.name", "Grace");           // dotted-path assignment
state.$setDefault("user.lastLogin", new Date());  // only if undefined
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

### Idempotence

`set` checks `oldValue !== value` before emitting. Writing the same primitive twice produces zero events. (Object identity matters — writing a new object literal with structurally identical contents is a different reference and will emit.)

### `$set` semantics

`$set(path, value)` walks the dotted segments:

```ts
state.$set("user.address.city", "Berlin");
```

If `user` exists but `user.address` is `undefined` (or `null`), `$set` creates an empty object at `user.address`, then assigns `city`. Each intermediate assignment goes through the `set` trap and emits at its own path — so a single `$set("a.b.c", v)` on a fresh tree emits at `a`, then `a.b`, then `a.b.c` (in that order).

If you need set-only-if-missing, use `$setDefault`. It walks the same way but the leaf assignment is gated by `current[lastKey] === undefined`.

---

## 4. The emitter

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

### Implications for writer style

- **Granular writes wake granular readers, not coarse ones.** `$set("rows.0.name", "x")` wakes a subscriber on `"rows.0.name"` but **not** a subscriber on `"rows"`.
- **Coarse writes wake coarse readers, not granular ones.** `$set("rows", newArr)` wakes a subscriber on `"rows"` but **not** a subscriber on `"rows.0.name"` (even if the new array has a different name at index 0).

The convention in core's chunk runtime is to **replace arrays / objects wholesale** in callbacks so any reader of the parent path wakes. If you use this library standalone, decide a convention up front — readers must subscribe to the exact path the writers will emit on.

### `on` returns an unsubscribe

```ts
const off = state.$emitter.on("count", handleCount);
// later:
off();   // detaches the handler
```

The function is idempotent — calling it multiple times has no effect after the first.

---

## 5. API reference

```ts
function createReactiveProxy<T extends object>(target?: T): T & {
  $emitter: Emitter;
  $set: (path: string, value: unknown) => void;
  $setDefault: (path: string, value: unknown) => void;
};
```

- **`target`** (optional) — the initial state. Defaults to `{}`. Mutates in place via the Proxy; if you want to keep the input untouched, clone it before passing.
- Return type adds `$emitter`, `$set`, `$setDefault` to the input type. Use these only on the root.

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

---

## 6. Performance notes

- **proxyCache** is a `WeakMap<object, object>`. Same source object → same proxy reference. Cheap subscribe / unsubscribe across re-renders because handler-set membership is by reference; you can also use proxy refs as React keys without churn.
- **Event lookup** is O(1) — a `Map.get(path)` followed by `Set.forEach(handler => handler(payload))`. There's no walk over a subscriber list trying to match prefixes.
- **No virtual-DOM diffing.** The proxy emits exactly one event per write. Consumers wake exactly when they should.
- **Memory bound** — the `proxyCache` and the emitter's `events` Map both grow as new paths are touched. Both are bounded by the size of the underlying state tree (proxyCache) or by the active subscriber set (emitter). In long-running apps, unsubscribe handlers when their owners unmount.

---

## 7. What this library is NOT

- **Not** a state-management framework like Redux or Zustand. There's no concept of actions, reducers, middleware, or store composition. Writes are direct assignment; subscriptions are direct callbacks.
- **Not** a deep equality observer. Writes are detected by reference change on the assigned property only. If you want deep-diff semantics, do the diff in your subscriber or write at the leaf path.
- **Not** a React-specific API. The library is plain JS. The chunk runtime ([`DSL.md`](./DSL.md)) is what wires it into React via `useReducer` + `useEffect`.
- **Not** a path query language. `$set` takes a dotted-string path, but there's no `$get`, no wildcards, no transactions, no batching. If you need batching, debounce the writes upstream of the proxy.

When in doubt, treat `createReactiveProxy` as a thin reactive primitive — read for it as you would the `useSyncExternalStore` contract, not as a framework. It's load-bearing precisely because it's small.

---

## Cross-references

- [`DSL.md`](./DSL.md) — the chunk-protocol DSL that uses this library to build per-list-item scopes and reactive component trees.
- [`createReactiveProxy.ts`](../src/render/createReactiveProxy.ts) — the source. Short enough to read in one sitting.
- [`../src/utils/utils.ts`](../src/utils/utils.ts) — `parseScope(key)` — used by the chunk runtime to split a `"scopes.X.Y"` dep string into `[scopeName, leafPath]` for emitter subscription.
