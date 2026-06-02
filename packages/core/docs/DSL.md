# The chunk-protocol DSL

This document is the **dev-facing** reference for how the chunk runtime works — what a chunk is, how it's evaluated, how state flows, how the renderer mounts a tree, how to register components, and what the boundaries of the package are. For the LLM-facing contract (the rules a chunk producer must obey), see [`../src/prompt/INSTRUCTIONS.md`](../src/prompt/INSTRUCTIONS.md). For the underlying reactive state library, see [`STATE.md`](./STATE.md).

Core is **catalog-agnostic**: it knows about chunks, expressions, scopes, and rendering, but knows nothing about specific components (Card, Input, Table). Components are registered into core at construction time and the runtime treats them as opaque registry entries.

---

## 1. What this is

A runtime that turns a **JSONL stream of "chunks"** (one JSON object per line) into a live React UI. Three properties that are load-bearing for the whole architecture:

- **No codegen, no build step per generation.** Chunks are interpreted at render time. A new generated page is a new array of chunks — same runtime.
- **Reactive state via Proxy.** Mutating `scopes.root.foo` notifies exactly the subscribers that read `scopes.root.foo`. No virtual DOM diffing of derived state; React re-renders the chunk that depends on the path that changed. See [`STATE.md`](./STATE.md).
- **Sandboxed expressions.** Every `expr` field is a JS micro-expression evaluated inside a stripped-down realm — no `eval`, no globals, no statements, no assignments. Only pure computation and a few allowed built-ins.

The chunk producer is, in practice, an LLM streaming over a JSON-Lines responder — but the runtime treats input as plain data. A unit test feeds it a literal array; a saved page rehydrates from a DB; a live stream pushes chunks as they arrive. Same code path.

---

## 2. Big picture

```
   ┌────────────────────┐       ┌─────────────────────┐
   │ ChunkComponent[]   │       │ host functions      │
   │ (stream / array /  │       │ (RPC calls, runtime │
   │  rehydrated DB)    │       │  helpers)           │
   └──────────┬─────────┘       └──────────┬──────────┘
              │                            │
              ▼                            ▼
   ┌──────────────────────────────────────────────────┐
   │ <Renderer lines={chunks} functions={fns} />      │
   │   └─ RendererRegistryProvider {                  │
   │        renderers, defaultPlaceholder, functions  │
   │      }                                           │
   │   └─ root scope = createReactiveProxy({})        │
   │   └─ buildElementsById(lines) → Record<key,chunk>│
   │   └─ for each op:"root" line → RecursiveRenderer │
   └──────────────────┬───────────────────────────────┘
                      ▼
   ┌──────────────────────────────────────────────────┐
   │ RecursiveRenderer (per chunk)                    │
   │   1. evaluate `defaults` once (suspends if async)│
   │   2. subscribe to extractDeps(chunk) on $emitter │
   │   3. lookup renderer in registry                 │
   │   4. render <Component chunk scopes>{children}/> │
   │      ├ children resolved recursively             │
   │      └ list children dispatched to ListRenderer  │
   └──────────────────────────────────────────────────┘
```

Inside each component, `createAIComponentRenderer` evaluates `chunk.props.expr` against the current scopes, threads typed props + bound callbacks into the actual React component, and (if `chunk.hidden` is set) wraps the result in React 19's `<Activity>` so hidden chunks keep their state.

---

## 3. File layout

```
packages/core/src/
├── types.ts                         — ChunkComponent, ValueExpr, AssignableExpr, Chunk union
├── eval/
│   ├── SafeEval.ts                  — sandboxed expression evaluator (acorn-based)
│   ├── evaluate.ts                  — `evaluate(expr, ctx, options)`; singleton SafeEval; getScopeReads()
│   ├── extractDeps.ts               — auto-detected reactive deps per chunk (WeakMap-cached)
│   └── JSONSchemaToTs.ts            — render JSON Schema to TS-like string for the prompt
├── render/
│   ├── createReactiveProxy.ts       — the Proxy state container with $emitter (see STATE.md)
│   ├── RecursiveRenderer.tsx        — RecursiveRenderer + ListRenderer (the tree walk)
│   ├── createAIComponentDef.ts      — def factory: { description, propDefs, callbackDefs, hidden }
│   ├── createAIComponentDefs.ts     — registry of defs + prompt-fragment generator (skips hidden)
│   ├── createAIComponentRenderer.tsx— renderer factory: pairs a def with a React component
│   ├── createAIComponentRenderers.tsx — top-level <Renderer> + RendererRegistryProvider
│   ├── createAIComponentRegistry.tsx— alt top-level entry (no functions support — legacy)
│   ├── RendererRegistry.tsx         — React context: { renderers, defaultPlaceholder, functions }
│   ├── ErrorBoundary.tsx            — per-chunk error boundary
│   ├── Fragment.tsx                 — host-only wrapper component + InitContext / InitFn types
│   └── shared.ts                    — shared event-payload schemas (onClickSchema, pickClick)
├── components/
│   ├── ConfirmModal.tsx             — useConfirm(); used by callbacks with a `confirm` field
│   ├── EditModeOverlay.tsx          — opt-in editor UI; not part of the runtime path
│   └── ui/                          — shadcn primitives used by ConfirmModal/EditModeOverlay
├── prompt/
│   ├── INSTRUCTIONS.md              — LLM-facing chunk-authoring contract
│   ├── INSTRUCTIONS.json            — generated; do not edit by hand
│   ├── getCommonInstructionsPartialPrompt.ts — INSTRUCTIONS.json wrapped as a partial
│   └── getComponentsPartialPrompt.ts / getFunctionsPartialPrompt.ts — partial-prompt builders the consuming app composes
└── utils/utils.ts                   — parseScope() + buildElementsById()
```

---

## 4. The chunk protocol — `types.ts`

A **chunk** is a `ChunkComponent` (= `ChunkComponentElement | ChunkComponentList`). The full type union including the meta envelope is `Chunk = ChunkComponent | ChunkMeta`.

### `ChunkComponentElement`

```ts
type ChunkComponentElement = {
  key: string;                 // unique id; partial replacement keys off this
  component: string;           // registry name, e.g. "Card", "Input", "Table"
  op: "root" | "child";        // exactly one chunk per page has op:"root"
  kind: "element";
  props?: ValueExpr;           // evaluates to the component's props object
  defaults?: AssignableExpr[]; // initial state, one-shot
  hidden?: ValueExpr;          // truthy → hide via <Activity mode="hidden">
  callbacks?: Record<string, AssignableWithConfirmExpr[]>;
  children?: string[];         // child chunk keys, in render order
};
```

### `ChunkComponentList`

```ts
type ChunkComponentList = {
  key: string;
  component: string;           // rendered once per item (e.g. "TableRow")
  op: "child";                 // lists cannot be root
  kind: "list";
  itemsSource: string;         // JS expression returning an array
  itemScope: string;           // globally unique scope name
  itemIdKey?: "_index" | "_item" | (string & {});  // stable identity per item
  props?: ValueExpr;           // evaluated per-item with itemScope available
  defaults?: AssignableExpr[];
  hidden?: ValueExpr;
  callbacks?: Record<string, AssignableWithConfirmExpr[]>;
  children?: string[];         // child keys; children render per-item
};
```

### `ValueExpr` and `AssignableExpr`

```ts
type ValueExpr = { expr?: string; literal?: unknown };
type AssignableExpr = { set: string } & ValueExpr;
type AssignableWithConfirmExpr = { confirm?: string } & AssignableExpr;
```

- `{ literal: X }` — value is `X` verbatim. Use when nothing depends on state.
- `{ expr: "<JS>" }` — evaluate the expression against current scope; the result is the value.
- `{ set: "scopes.X.Y", … }` — additionally write the result to a scope path.
- `{ confirm: "Are you sure?", … }` — block the chained-callback walk on a modal Yes/No.

The chunk's tree-shape (parent → children by key reference) lives in `buildElementsById` ([`utils.ts`](../src/utils/utils.ts)) which flattens the JSONL array into a `Record<key, ChunkComponent>` map, applying partial-replacement semantics on duplicate keys (§13).

---

## 5. Expressions — micro-expressions and `SafeEval`

Every `expr` field is a **single JavaScript expression** evaluated by [`SafeEval`](../src/eval/SafeEval.ts). Not statements, not assignments, not declarations, no loops. Arrow-function bodies *may* contain block statements (so `.reduce((acc, item) => { const x = item.v; return acc + x; }, 0)` works), but the top-level expression is always a single expression.

### What's allowed

The parser is acorn. After parse, `validateNode` walks the AST and rejects anything from `FORBIDDEN_NODE_TYPES`. Allowed in practice:

- Member access: `scopes.root.x`, `scopes.row.item.name`
- Computed access: `arr[i]`, `obj["key"]`
- Arithmetic, comparison, logical, ternary, nullish, optional chaining
- Object / array / template literals
- Arrow functions (callbacks for `.filter`/`.map`/`.reduce`)
- A whitelist of constructors via `new` (`Date`, `Set`, `Map`, typed arrays — see `SAFE_NEW_CONSTRUCTORS`)
- Calls to host-provided functions exposed via the `functions` prop (§12)
- `await` — when used, the compiled function becomes `AsyncFunction` automatically

### What's forbidden

- `eval`, `arguments`, `Function`, `setTimeout`, `setInterval`, `fetch`, `XMLHttpRequest`, all globals listed in `GLOBALS_TO_SHADOW` — shadowed as `undefined` parameters
- Access to `constructor`, `__proto__`, `prototype`, `__defineGetter__`, etc. — `FORBIDDEN_PROPERTIES`
- Statements, declarations, assignments, `++`/`--`, `yield`, dynamic `import()`, `import.meta`/`new.target`
- Tagged template literals

### How it's compiled

`SafeEval.compile()`:

1. `validate()` parses + walks the AST, throws on anything forbidden, and extracts `scopeReads` (§7).
2. The expression text is wrapped in `"use strict"; return (${expr})` and passed to `new Function(...params, body)` (or `new AsyncFunction(...)` if `await` is present).
3. Parameter list = context keys ∪ shadow-params. Shadow-params bind globals to `undefined` so an expression body referring to `fetch` resolves to `undefined`, not the real global.
4. Compiled function is cached in `#cache: Map<string, CacheEntry>`, LRU-evicted at 500 entries by default. The cache entry holds both the compiled `fn` and the analysis (`isAsync`, `scopeReads`).

The wrapper is `void (${expr})` for parsing only — it forces expression context so `{...}` parses as object literal rather than block statement. The compiler then drops the `void` wrapper and uses the real `return (${expr})` shape.

### Eval context

The context object passed by `evaluate()` is:

```ts
{
  ...callerContext,         // typically { scopes, evt? }
  ...(options?.functions ?? {})  // host functions via the Renderer prop
}
```

So inside an expression you have:

- `scopes` — the reactive proxy bag (§6)
- `evt` — only inside callback expressions; carries event-specific data per the callback's def
- Any host function passed in via `<Renderer functions={…} />`
- Any allowed global from `allowGlobals`: `Math`, `Date`, `JSON`, `Array`, `Object`, `String`, `Number`, etc.

---

## 6. State — the reactive Proxy

All mutable state lives in `createReactiveProxy`. Each *scope* is one instance: the root scope, one per list item, one per nested-list item.

For the mechanics of the proxy itself — reads, writes, the emitter, identity, and the path-exact subscription model — see [`STATE.md`](./STATE.md). The rest of this section covers how the chunk runtime *uses* the proxy.

### `$set`, `$setDefault`, `$emitter` at the scope root

Only the proxy at `path.length === 0` exposes the framework hooks:

- `proxy.$emitter` — the emitter ref. Subscribers do `scopes.<scopeName>.$emitter.on(path, handler)`.
- `proxy.$set(path, value)` — walks the dotted path creating intermediate objects as needed; the final assignment goes through the `set` trap (so it emits). Used by `defaults` and `callbacks` from inside the renderer.
- `proxy.$setDefault(path, value)` — same as `$set` but no-op if the leaf already has a value.

Sub-proxies (`scopes.inv.rows`, `scopes.inv.rows[0]`, etc.) don't expose `$emitter` / `$set`; the emit goes to the parent scope's shared emitter.

### Writer convention

The runtime is path-exact. **Replace arrays / objects wholesale** in callbacks so any reader of the parent path wakes. Granular leaf-writes (`$set("rows.0.name", "x")`) only wake readers that subscribed to that exact leaf path. See [`STATE.md`](./STATE.md) §3 for the full rules.

---

## 7. Scopes & nested scopes

### The shape

`scopes` is a **plain object** (not a proxy) whose values are reactive proxies:

```ts
scopes = {
  root: <reactiveProxy of {}>,
  row:  <reactiveProxy of { item, index, id }>,   // inside a list
  cell: <reactiveProxy of { item, index, id }>,   // inside a nested list under row
}
```

Each entry has its own emitter (one per `createReactiveProxy` call). So `scopes.root.$emitter` and `scopes.row.$emitter` are different objects — emits in one scope don't reach subscribers in another. But sub-proxies *within* a scope share the scope's emitter.

The top-level Renderer creates `root` once and passes `{ root }` as the initial `scopes`. Lists then extend this object with item proxies, scoped under the chunk's `itemScope` name.

### Nested-list scopes

Each list creates per-item proxies with `createReactiveProxy({ item, index, id })`. These proxies are **cached by item id** in a ref-held `Map` so they survive re-renders (preserving per-item state like input focus, edit buffers, expansion toggles).

For each item, the list builds an extended scopes object:

```ts
const itemScopes = {
  ...scopes,                  // inherits parent scopes (e.g. root)
  [line.itemScope]: itemProxy,
};
```

…and passes it down. A chunk inside a list-item subtree sees `scopes.<itemScope>.item` / `.index` / `.id`, plus everything its ancestors saw.

Nested lists work by stacking: a `row` list inside the root, then a `cell` list inside each row, gives item-scope chunks visibility of `scopes.root`, `scopes.row`, `scopes.cell`.

### `childScopes` for aggregation

Each list also stashes its per-item proxy array onto the **last scope before the list** so a parent can read across all items:

```ts
lastScope.$set(`childScopes.${line.itemScope}`, itemScopesList);
```

So a chunk at the root can sum every row's value via:

```ts
scopes.root.childScopes.row.reduce((acc, r) => acc + r.item.value, 0)
```

For nested lists, chain: `scopes.root.childScopes.row.childScopes.cell`.

### Scope-name discipline

The constraint surfaced in [`INSTRUCTIONS.md` §4](../src/prompt/INSTRUCTIONS.md): **scope names must be globally unique across all lists**. If two different lists both used `itemScope: "item"`, the second would overwrite the first in the scopes object as you descend into the inner list, and outer-scope reads would silently break.

---

## 8. Reactivity — auto-detected deps

For each chunk, the renderer subscribes to every scope path the chunk *reads* in its **reactive sites**:

- `chunk.props.expr`
- `chunk.hidden.expr`
- `chunk.itemsSource` (list chunks)

`defaults` and `callbacks` are NOT scanned: defaults run once at mount (gated by `hasBeenRenderedRef.current`); callbacks run on event and read current state at fire time.

### The pipeline

1. `SafeEval.validate(expr)` runs the acorn parse + AST walk. Same pass extracts every `scopes.X.Y` chain it sees. Stops a chain at the first `CallExpression` callee segment (`.filter` etc.), `ComputedMember`, or non-Identifier property. Recurses into call arguments and computed-key sub-expressions so reads inside `.filter(r => …scopes.root.x…)` are still captured.
2. `safeEval.scopeReads(expression)` returns the cached `string[]`.
3. `extractDeps(chunk)` unions the read sets across all reactive sites of one chunk and caches the union in a `WeakMap<ChunkComponent, string[]>` so the per-render lookup is O(1).
4. `RecursiveRenderer` and `ListRenderer` subscribe: for each dep, `parseScope(dep)` → `[scope, path]`, then `scopes[scope].$emitter.on(path, forceRender)`.

### Why static AST

Two practical properties:

- **No over-subscription.** Only paths the expression actually reaches as data are recorded. Method-call segments are dropped (`scopes.inv.rows.filter(...)` yields `scopes.inv.rows`, not `scopes.inv.rows.filter`). String-literal contents are not matched. Result: subscribers fire on real path-writes, never on unrelated state changes.
- **No expression execution.** Other options (Proxy-based runtime tracking) would have to run the expression body to harvest reads — and would record method-dispatch gets (`.filter`, `.map`) as deps, causing dead subscriptions. Static AST sidesteps this.

The "missed dynamic-key access" case is real but currently a non-issue: the LLM prompt forbids `scopes[var]`, and no current chunk uses it. If/when this is needed, fall back to enumerating `Object.keys(scopes)` and subscribing to the static suffix on each.

### Path-exact subscription, no bubble

Subscribers register on the *exact* dep string. Writers emit on the exact `set` path. Reader-writer agreement is by path equality. The renderer never tries to bubble or fan out by prefix — the `createReactiveProxy` set trap emits one event at one path, and `extractDeps` records the leaf path; both ends meet.

This means **the LLM's writer convention matters**. If a callback does `$set("scopes.inv.rows", newArr)`, every reader of `scopes.inv.rows` (whether via `.length`, `.map`, `.filter`, etc.) wakes. If a callback does `$set("scopes.inv.rows.0.name", "x")`, only readers of that exact path wake. Current callbacks write wholesale.

---

## 9. Defaults & callbacks

### `defaults`

Run **once**, when the chunk first mounts. Gated by `hasBeenRenderedRef.current`. Each entry is an `AssignableExpr`:

```ts
{ "set": "scopes.root.users", "expr": "UserRPC_getUsers()" }
```

Four things to notice:

1. **All defaults in one chunk are evaluated BEFORE any value is written.** They're collected, then written. So a later default *cannot* read a value set by an earlier default in the same chunk. If you need that chaining, split across parent/child chunks (child mounts after parent finishes).
2. **Async defaults suspend the chunk.** If any default expression returns a Promise, the chunk wraps itself in `<Suspense>` with `use(promise)` and renders the registered placeholder until all promises resolve.
3. **No re-run on partial replacement.** A chunk re-emitted with the same key keeps its scope state — defaults don't fire again if the renderer instance survives.
4. **Use `defaults` for state, not derivations.** The right things to put in `defaults` are values the user (or a mount-time RPC) initializes once and the page then reads/mutates over its lifetime — form fields, selections, search terms, pagination cursors, raw fetched lists. Values *computed from* other state — a filtered list, sorted list, paginated slice, sum, formatted string — do not belong here; they go inline in `props.expr` / `hidden.expr` / `itemsSource`, where auto-deps subscribes to the inputs and recomputes on change. A derivation in `defaults` is correct at mount and stale forever after. The LLM is taught this in [`INSTRUCTIONS.md` §3](../src/prompt/INSTRUCTIONS.md).

### `init` — host-side seeding (not a chunk field)

`defaults` is the LLM's tool for seeding state at mount. **`init` is the *host's* tool** for the same job — data the consuming app already has in memory (or can prefetch synchronously) at mount time and doesn't want the LLM to re-seed.

```tsx
<Renderer
  lines={chunks}
  init={({ scopes }) => {
    scopes.root.headings = { customers: { customer: "Customer", email: "Email" } };
  }}
/>
```

`init` is a **prop on `<Renderer>`**, not a chunk field. It runs exactly once, before any LLM-emitted root chunk evaluates its `props`/`defaults`. Three things to know:

1. **Side effects only.** The callback's return value is ignored. Mutate via the reactive Proxy (`scopes.root.x = y`); the assignment routes through the same `set` trap as `$set` (see [`STATE.md`](./STATE.md)), so subscribers wake the same way.
2. **Sync vs async.** Sync writes land before children mount. If the callback returns a Promise (`async ({ scopes }) => { scopes.root.x = await fetch(...) }`), the wrapper Suspends via the same path async string-form defaults use (§9 above) — children mount only after it resolves.
3. **Fires once.** Same `hasBeenRenderedRef` guard that pins `defaults` to one shot. New chunks streaming in re-render the Renderer; `init` does NOT re-fire.

Mechanically, the Renderer **always** wraps its root chunks in a synthetic `{ component: "Fragment", op: "root", … }` chunk; `init` lands on that wrapper. See §11 for the wrap details.

`init` is intentionally narrower than `defaults`:

- **No `set` field.** The callback is a pure side-effect — hosts in TS can write arbitrarily complex objects to multiple paths in one call, no need to enumerate `{ set, expr }` pairs.
- **No reactivity.** Once `init` runs, it's gone. The state it wrote is reactive; the callback itself is not re-triggered by scope changes.
- **No LLM authoring.** The chunk protocol doesn't include `init` — it's a Renderer prop only. The LLM can't emit it and shouldn't try; `Fragment` itself is registered with `hidden: true` so it never appears in the LLM-facing component menu (§12).

### `callbacks`

Triggered by component events. Each callback name maps to an array of `AssignableWithConfirmExpr`:

```ts
"onChange": [
  { "set": "scopes.root.q", "expr": "evt.value" },
  { "set": "scopes.root.results", "expr": "TaskRPC_search({ query: { q: scopes.root.q } })" }
]
```

Execution semantics:

- Steps execute **sequentially**. Each `await`s its expression before the next runs.
- Inside a callback expression, `evt` is bound to the event payload typed per the callback's def (`evt.value`, `evt.valueAsNumber`, etc.). The component renderer constructs the payload.
- `confirm`: if a step has `{ confirm: "Are you sure?", … }`, the renderer opens the `ConfirmModal` before evaluating that step's expression. On cancel, the step **and all subsequent steps** are skipped. Place `confirm` on the first dangerous step.
- A small `await new Promise(resolve => setTimeout(resolve, 0))` yields between steps so the React render scheduler can pick up the previous `$set` before the next one fires — avoids a race where a derived dep update lags the next chained expression's read.

### The purity rule

Expressions in `props.expr`, `hidden.expr`, `defaults[].expr`, and `callbacks[].expr` must be **pure**. They return a value. The *only* way to write state is through the `"set"` field on `defaults` / `callbacks`. Mutating `scopes.X` from inside an expression body (e.g. via `(() => { scopes.x = y; return … })()`) creates write-during-render which the renderer re-evaluates and re-fires, producing infinite-loop or stale-state bugs.

The LLM is prompted with this rule in [`INSTRUCTIONS.md` §2](../src/prompt/INSTRUCTIONS.md). The runtime doesn't enforce it directly — `safe-eval`'s ban on `AssignmentExpression` would catch direct `scopes.x = …` but not the IIFE form. Treat it as a contract.

---

## 10. Lists

`ListRenderer` is the workhorse:

1. **Subscribe to deps** (auto-extracted from `itemsSource` + the list chunk's own `props`/`hidden`) — typing in a search input drives a `$set` on the searchTerm path, which wakes the list, which re-evaluates `itemsSource` and re-renders.
2. **Evaluate `itemsSource`**: `evaluate({ expr: line.itemsSource }, { scopes }, { functions })`. Returns the items array; `?? []` if undefined.
3. **Compute item ids** via `getItemId(itemIdKey, item, index)`. Default is `_index` (positional); `_item` uses the value itself (good for primitive arrays); a string key reads `item[key]`. **Use a stable key when items are objects** — without it, edits-in-place can shift positions and lose per-item state.
4. **Prune the proxy cache** — items removed from the source array have their cached proxies dropped so memory is bounded.
5. **For each item**, look up or create the per-item proxy. Mutate `(itemProxy as any).item = item` and `.index = index` so the values reflect the latest source array (existing item, new value or position).
6. **Render** `<RecursiveRenderer>` once per item with `itemScopes = { ...scopes, [line.itemScope]: itemProxy }`. The same `elementKey` is passed for each — each item renders the list chunk *itself* as its root, with the item scope wired in.
7. **Publish** `childScopes.${itemScope} = itemProxiesList` on the parent scope for cross-item aggregation.

The list chunk's `component` is rendered **once per item**. There's no separate "list container" component for the list itself — the parent chunk that *contains* the list provides the container (e.g. a `TableBody` parent with a `TableRow` list child).

---

## 11. Rendering pipeline

Three layers stack inside the runtime:

### Outer — `createAIComponentRenderers`

Bundles a registry of renderers with the `<Renderer>` component. Construction time:

```ts
const { Renderer } = createAIComponentRenderers(
  componentRenderers,                    // Record<string, AIComponentRenderer>
  { defaultPlaceholder: SomeSpinner },   // optional, used when a renderer's own placeholder isn't set
);
```

Usage time:

```tsx
<Renderer lines={chunks} functions={hostFns} init={hostInit} editMode={false} onEdit={…} />
```

Internally:

- Memoizes the registry value (`{ renderers, defaultPlaceholder, functions }`) so context identity only changes when `functions` changes.
- Creates one `root` reactive proxy at module top-level.
- **Auto-merges a `Fragment` renderer** into the consumer-supplied registry. Fragment is host-only (`hidden: true` in its def), renders `<>{children}</>` with no wrapping DOM, and is the one component the synthetic wrapper below references by name.
- `buildElementsById(lines)` flattens the JSONL into a key→chunk map.
- Filters root chunks (`op === "root"`), dedupes by key, and assembles them as the `children` of a **single synthetic Fragment chunk** (`key: "__renderer_fragment__"`). The Fragment becomes the lone top-level mount; the original AI roots are its children. Visually identical to the un-wrapped tree (Fragment renders children directly), but it gives the `init` prop (§9) exactly one mount point to attach to. The wrap happens whether or not `init` is provided — keeping tree topology consistent across init/no-init renders.
- Mounts the Fragment via `<RecursiveRenderer init={init} … />`. The `init` prop is **not** propagated to recursive child mounts inside `RecursiveRenderer` — only the top-level synthetic Fragment runs the callback. Descendants always see `init=undefined`.
- Wraps the whole tree in `RendererRegistryProvider` and `EditModeOverlay`.

### Middle — `RendererRegistry` context

Just a React context carrying `{ renderers, defaultPlaceholder, functions }`. Every component inside the tree calls `useRendererRegistry()` to look up its renderer by name, the placeholder fallback, and the host functions to pass into evaluator calls.

### Inner — `RecursiveRenderer` + `createAIComponentRenderer`

`RecursiveRenderer` walks the chunk tree. For each chunk:

1. **Subscribe to auto-detected deps** (§8).
2. **Build children**: map `element.children` to `<RecursiveRenderer>` (or `<ListRenderer>` for list children). If `element.children?.length` is falsy, children are `null` — important because some persistence layers rehydrate an unset `children` column as `[]`, and the array-aware guard prevents that from clobbering `chunk.props.children` text content downstream.
3. **Run defaults** (one-shot). If async, suspend the chunk via `<Suspense>` + `use(promise)`.
4. **Render** the component via `<Component chunk={element} scopes={scopes}>{children}</Component>` — where `Component` is the registered renderer entry's `component`.

Inside the component, `createAIComponentRenderer`:

1. **Evaluate `chunk.props`** against the current scopes → props object.
2. **Evaluate `chunk.hidden`** → boolean (or treat absence as `false`).
3. **Build bound `callbacks`** — each handler closes over `chunk.callbacks[key]` and walks the steps when called, with `evt` bound to the event payload.
4. **Build children prop**: if `children` from RecursiveRenderer is non-empty *array*, use it; otherwise, let any `children` from `props` take effect (text content, etc.). The array-aware guard is what makes "table cells display their `chunk.props.children = scopes.row.item.name`" work for leaf chunks.
5. **Render** `renderer({ ...props, ...callbacks, children?, generatedKey: chunk.key })`.
6. If `chunk.hidden` was specified, wrap in `<Activity mode={hidden ? "hidden" : "visible"}>`. React 19's `<Activity>` keeps the subtree mounted with its state but suspends rendering — toggling visibility doesn't lose component state.

---

## 12. Component registration — def + renderer

A renderable component is a pair of declarations, conventionally co-located in the consuming catalog.

### `def.ts` — the *partner module* the LLM reads

```ts
import { createAIComponentDef } from "core";
import z from "zod";

export const InputDef = createAIComponentDef({
  description: "A text input field…",
  propDefs: z.strictObject({
    value: z.any().meta({ description: "The current input value" }),
    type:  z.enum(["text", "email", "password"]).default("text"),
    placeholder: z.string().optional(),
    disabled: z.boolean().default(false),
  }),
  callbackDefs: {
    onChange: z.strictObject({
      value: z.string(),
      valueAsNumber: z.number(),
    }),
    onFocus: z.strictObject({}),
    onBlur: z.strictObject({ value: z.string(), valueAsNumber: z.number() }),
  },
});
```

The def's `description` and the JSON-Schema of `propDefs` / `callbackDefs` get serialized into the LLM prompt via `createAIComponentDefs.getDefPartialPrompt()`, which renders Zod schemas to TypeScript-like type strings using `JSONSchemaToTs`.

### `renderer.tsx` — the actual React component

```ts
import { createAIComponentRenderer } from "core";
import { Input as ShadcnInput } from "./shadcn-input";
import { InputDef } from "./def";

export const InputRenderer = createAIComponentRenderer({
  def: InputDef,
  renderer: ({ value, type = "text", placeholder, disabled, onChange, generatedKey }) => (
    <ShadcnInput
      type={type}
      value={value as string}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(e) => onChange?.({ value: e.target.value, valueAsNumber: e.target.valueAsNumber || 0 })}
      data-key={generatedKey}
    />
  ),
});
```

The renderer's signature is *typed against the def*: props are inferred from `propDefs`, callbacks become `(args) => Promise<void>` based on `callbackDefs`. Plus an implicit `children?: ReactNode` and `generatedKey: string`.

### Registration

The consumer maintains two registries:

- `componentDefs` — `createAIComponentDefs({...})` maps name → def. Drives the prompt.
- `componentRenderers` — plain record of name → renderer. Passed to `createAIComponentRenderers(...)`.

**Adding a component requires updating both maps.** There's no codegen step linking them — discipline only.

### Hiding host-only defs from the LLM

`createAIComponentDef` accepts an optional `hidden?: boolean`. Defs marked `hidden: true` are kept in the renderer registry (so chunks referencing them mount correctly), but **`getDefPartialPrompt()` filters them out** of both the "# Available Components" name list and the "# Component Details" schema dump. Use for host-managed infrastructure that should never appear in the LLM's component menu.

Today the only `hidden` def is `Fragment` (see §9 / §11) — the synthetic wrapper used to host the `Renderer.init` callback. It's auto-merged into the renderer registry by `createAIComponentRenderers`, so consumers don't have to register it manually.

---

## 13. Host functions

A host can expose bare-identifier functions to every expression inside the tree via the `functions` prop on `<Renderer>`:

```tsx
<Renderer lines={chunks} functions={hostFunctions} />
```

`functions` is typed as `EvaluateFunctions = Record<string, (...args: any[]) => any>`. The deliberate `any` is because each function has its own concrete signature and TS strict-function-types variance would reject `Record<string, (...args: unknown[]) => unknown>`.

### How they're threaded

1. `<Renderer functions={…}>` puts them into the registry value.
2. `useRendererRegistry()` reads them at every evaluate site.
3. `evaluate()` spreads them into the eval context **after** `context`, so a host function wins over an equally-named scope variable.

From inside an expression:

```ts
setCell({ a1: 'Sheet1!A1', value: scopes.row.item.total })  // resolves async
```

works because `setCell` is in the eval context as a bound callable. RPC-style functions return promises; in callbacks the renderer awaits each step before proceeding.

### When to use

Use host functions for **runtime CRUD against the user's data** or anything that needs context the chunk producer can't have (auth tokens, browser-only APIs). Don't use them as a back door to mutate scope state — `set` is the way.

---

## 14. Partial replacement

To fix a bug in an emitted chunk subtree, re-emit the chunk with the **same key**. `buildElementsById` detects the duplicate key, walks the *old* chunk's descendants via `collectDescendantIds`, deletes them from the map, then inserts the new chunk in place. Any new children the re-emitted chunk references must be emitted afterwards with `op:"child"` as usual.

Properties to know:

- **State above the replaced subtree is preserved.** Only the subtree re-mounts; ancestor scopes are untouched.
- **Sibling chunks not in the new `children` array are dropped.** If the old chunk had children `[A, B, C]` and the new has `[A, D]`, the *whole* old subtree of A/B/C and below is wiped, then the new A/D get rendered fresh. There's no per-child diff.

The pattern is meant for *correcting mistakes mid-stream*, not for ongoing reactive updates. Reactive updates flow through `set` + auto-deps.

---

## 15. Hidden — conditional visibility

`chunk.hidden` is a `ValueExpr` evaluated every render. If truthy, the chunk wraps in `<Activity mode="hidden">`. React 19's Activity:

- Keeps the subtree **mounted** with state intact.
- Pauses effects and rendering until it goes visible again.
- Toggles visibility without losing input focus, scroll position, expanded toggles, etc.

So `hidden` is *not* unmount/remount — it's display-toggle with state preservation. Useful for tabs, accordions, conditional panels. Auto-deps treats `hidden.expr` as reactive: writing the path it reads wakes the chunk and flips visibility.

---

## 16. Performance notes

- **Expression parse** — once per unique expression string, cached on `SafeEval.#cache` (LRU @ 500 entries default). Subsequent compiles / evaluates are O(1) cache hits. Acorn parse of a 30-100 char expression is ~10-25 μs; the cached path is sub-microsecond.
- **`extractDeps`** — `WeakMap<ChunkComponent, string[]>`. One walk per chunk reference, free thereafter.
- **Proxy cache** — `WeakMap<object, object>` (see [`STATE.md`](./STATE.md)). Same source object → same proxy reference. Cheap subscribe / unsubscribe across re-renders because handler-set membership is by reference.
- **Item proxies** — keyed by item id; survives re-renders so per-item state (input focus, edit mode) is preserved across source-array mutations.
- **No virtual-DOM diffing of derived state** — instead of recomputing every prop every render, the proxy emits exactly one event per write, and only the chunks subscribed to that path re-render.
- **Re-render granularity** — a forceRender on the chunk's `useReducer` triggers a React re-render of *that chunk only*. React then diffs the underlying component normally.

---

## 17. Authoring a new AI component

1. Pick a name (PascalCase, matches the LLM-visible component string).
2. Create `<Name>/def.ts` with `description`, `propDefs`, `callbackDefs`.
3. Create `<Name>/renderer.tsx` pairing the def with the React render function.
4. Register in your catalog's `defs.ts` and `renderers.ts`. Both maps must include the new entry — without both, the LLM either can't produce the component or can produce but not render it.
5. If the component has nontrivial events, define the event payload schema with Zod meta-descriptions so the LLM knows the field names it'll see in `evt`.

`propDefs` is the contract with the LLM. Use `.meta({ description: "…" })` on every field so the LLM has enough information to fill it in correctly. Mark optional fields with `.optional()` and supply sensible `.default()` values where applicable.

---

## 18. What is NOT in core

For boundary clarity:

- **Specific components** — Card, Input, Table, etc. live in the consuming catalog, not in core. Adding them in core is wrong even if you imagine they're "primitives."
- **Persistence** — core doesn't know about Prisma, DB schemas, or persisted-row tables. Consumers handle the round-trip: serialize chunks on stream, rehydrate from rows on cold load, feed back into `<Renderer lines={...} />`.
- **Prompt assembly** — core ships catalog-agnostic partial-prompt builders (`getCommonInstructionsPartialPrompt`, `getComponentsPartialPrompt`, `getFunctionsPartialPrompt`); the consuming app composes them into its full system prompt (e.g. neat-report joins them per endpoint, inline, to form each `system` message). Any example chunk fixtures are catalog-flavoured content, not core.
- **RPC / external APIs** — core knows the shape of host functions (`EvaluateFunctions`) but doesn't ship any. The consumer passes them in via the `<Renderer functions={...} />` prop.
- **Auth / sessions** — consumer concern. Core runs the same way whether the user is signed in or not.

When in doubt, ask: "Would a different consumer of core (a future product line, a unit test, a Storybook playground) also need this?" If yes — core. If no — consumer.

---

## Cross-references

- [`STATE.md`](./STATE.md) — the reactive proxy state library underneath all of this.
- LLM-facing contract for chunks: [`../src/prompt/INSTRUCTIONS.md`](../src/prompt/INSTRUCTIONS.md)
- The expression evaluator and its allow-list: [`../src/eval/SafeEval.ts`](../src/eval/SafeEval.ts)
- The auto-detection helper: [`../src/eval/extractDeps.ts`](../src/eval/extractDeps.ts)
