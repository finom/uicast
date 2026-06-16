# Overview — the engine runtime

This document is the **dev-facing** reference for how the **framework-agnostic engine** works — what an element (line) is, how it's evaluated, how state flows, how a renderer mounts a tree (conceptually), how to register components, and what the boundaries of the package are. **`@ui-fired/core` has zero React imports**; the reference React binding that actually mounts an element tree to the DOM is [`@ui-fired/react`](./REACT.md). Companion docs: the **React binding** is [`REACT.md`](./REACT.md); the **normative format contract** is [`SPEC.md`](./SPEC.md); the **per-property authoring reference** for each line field is [`LINES.md`](./LINES.md); the expression syntax (and the evaluator's security limits) is [`EXPRESSIONS.md`](./EXPRESSIONS.md); the reactive state library is [`SCOPES.md`](./SCOPES.md); the LLM-facing contract an element producer must obey is [`../src/prompt/INSTRUCTIONS.md`](../src/prompt/INSTRUCTIONS.md).

Core is **catalog-agnostic** *and* **UI-framework-agnostic**: it knows about elements, expressions, scopes, and reactivity, but knows nothing about specific components (Card, Input, Table) and nothing about React. Components are registered into a binding at construction time and treated as opaque registry entries.

---

## 1. What this is

A runtime that turns a **JSONL stream of "elements"** (one JSON object per line) into a live UI through a framework binding. The **engine** (this package) is framework-agnostic; the reference binding renders to React (see [`REACT.md`](./REACT.md)). Three properties that are load-bearing for the whole architecture:

- **No codegen, no build step per generation.** Elements are interpreted at render time. A new generated page is a new array of elements — same runtime.
- **Reactive state via Proxy.** Mutating `scopes.root.foo` notifies exactly the subscribers that read `scopes.root.foo`. No virtual DOM diffing of derived state; the binding re-renders only the element that depends on the path that changed. See [`SCOPES.md`](./SCOPES.md).
- **Constrained expressions.** Every `expr` field is a JS micro-expression evaluated with ambient globals shadowed, statements/assignments blocked, and prototype access filtered — only pure computation and a few allowed built-ins. This is a best-effort guardrail, **not** a containment boundary; see [`EXPRESSIONS.md`](./EXPRESSIONS.md) → Security.

The element producer is, in practice, an LLM streaming over a JSON-Lines responder — but the runtime treats input as plain data. A unit test feeds it a literal array; a saved page rehydrates from a DB; a live stream pushes elements as they arrive. Same code path.

---

## 2. Big picture

```
   ┌────────────────────┐       ┌─────────────────────┐
   │ ComponentEntry[]   │       │ host functions      │
   │ (stream / array /  │       │ (RPC calls, runtime │
   │  rehydrated DB)    │       │  helpers)           │
   └──────────┬─────────┘       └──────────┬──────────┘
              │                            │
              ▼                            ▼
   ┌──────────────────────────────────────────────────┐
   │ <Renderer lines={elements} functions={fns} />      │
   │   └─ RendererRegistryProvider {                  │
   │        implementations, systemVisuals, functions │
   │      }                                           │
   │   └─ root scope = createProxyScope({})        │
   │   └─ buildElementsById(lines) → Record<key,element>│
   │   └─ for each root element → RecursiveRenderer     │
   └──────────────────┬───────────────────────────────┘
                      ▼
   ┌──────────────────────────────────────────────────┐
   │ RecursiveRenderer (per element)                    │
   │   1. evaluate `defaults` once (suspends if async)│
   │   2. subscribe to extractDeps(element) on $emitter │
   │   3. lookup renderer in registry                 │
   │   4. render <Component element scopes>{children}/> │
   │      ├ children resolved recursively             │
   │      └ list children dispatched to ListRenderer  │
   └──────────────────────────────────────────────────┘
```

The `<Renderer>` / `RendererRegistryProvider` / `RecursiveRenderer` / `createComponentImplementation` layers shown here are the **reference React binding** — full pipeline detail (including the `<Suspense>` / `<Activity>` mechanics) is in [`REACT.md`](./REACT.md) §2. From the engine's side, what crosses the seam is `createProxyScope`, `buildElementsById`, `extractDeps`, and `evaluate` — see §7 of [`REACT.md`](./REACT.md) for the exact surface a non-React binding implements.

---

## 3. File layout

```
packages/core/src/                   — the framework-agnostic engine (zero React)
├── types.ts                         — ComponentEntry + ComponentListEntry (list = element with required each/as), ValueSource, ValueSourceAssignment
├── expr/
│   ├── validate.ts                  — the guardrail: walk the parsed AST, reject what must not run
│   ├── safe-eval.ts                 — SafeEval: compile + cache + run what validate.ts approves (acorn-based)
│   ├── ast-utils.ts                 — acorn-AST helpers (isNode, childNodes) — NOT a parser
│   ├── analyze.ts                   — static analysis: await detection + scope-read extraction (NOT security)
│   ├── globals.ts                   — global-name policy: allow-list + shadow-list (allow-list also feeds the prompt)
│   ├── evaluate.ts                  — `evaluate(expr, ctx, options)`; singleton SafeEval; getScopeReads()
│   └── extract-deps.ts               — auto-detected reactive deps per element (WeakMap-cached)
├── scope/
│   ├── create-proxy-scope.ts          — the Proxy state container + path-keyed emitter (see SCOPES.md)
│   └── parse-scope.ts                — splits a `scopes.X.Y` key into [scopeName, leafPath]
├── def/
│   └── create-component-definition.ts      — def factory: { name, description, props, callbacks, hidden } (agnostic partner-def half)
├── prompt-utils/
│   └── json-schema-to-ts.ts            — render JSON Schema to TS-like string for the prompt
├── prompt/
│   ├── INSTRUCTIONS.md              — LLM-facing element-authoring contract
│   ├── INSTRUCTIONS.json            — generated; do not edit by hand
│   ├── get-common-instructions-partial-prompt.ts — INSTRUCTIONS.json wrapped as a partial
│   └── get-components-partial-prompt.ts / get-functions-partial-prompt.ts / get-expressions-partial-prompt.ts — partial-prompt builders the consuming app composes
└── utils/utils.ts                   — buildElementsById() (element-tree flatten + partial-replacement)
```

The **React binding** — `RecursiveRenderer` / `ListRenderer`, the `<Renderer>` component, `createComponentImplementation`, the registry context, `ErrorBoundary`, the synthetic `RootFragment`, and the confirm host — lives in **`@ui-fired/react`**; its layout is [`REACT.md`](./REACT.md) §1. The catalog event-payload helpers (`onClickSchema` / `pickClick`) live in **`@ui-fired/catalog`**.

---

## 4. The element model — `types.ts`

An **element** (one JSONL line) is a `ComponentEntry`. The shape carries `key`, `component`, and the optional `props` / `defaults` / `hidden` / `callbacks` / `children`, plus the optional list fields `each` / `as` / `keyBy`. An element is a **list** (`ComponentListEntry`) **iff** it carries `each` — list-ness is structural, the same way root-ness is (an element that no `children` array references). There's no `kind` discriminator; narrow in TS with `isComponentListEntry(el)`.

> **Per-property reference → [`LINES.md`](./LINES.md).** Every field, its type, its value forms (`literal` / `expr` / `set` / `confirm`), and its authoring semantics live there. This section covers only how the runtime treats the element model as a whole.

(Any streaming envelope around elements — a per-line meta object, or a union of `ComponentEntry` with such an envelope — is **not** a core type. Core is transport-agnostic: the consuming app owns whatever it wraps elements in on the wire.)

The element's tree-shape (parent → children by key reference) lives in `buildElementsById` ([`utils.ts`](../src/utils/utils.ts)) which flattens the JSONL array into a `Record<key, ComponentEntry>` map, applying partial-replacement semantics on duplicate keys (§14).

---

## 5. Expressions — micro-expressions and `SafeEval`

Every `expr` field is a **single JavaScript expression** evaluated by [`SafeEval`](../src/expr/safe-eval.ts). Not statements, not assignments, not declarations, no loops. Arrow-function bodies *may* contain block statements (so `.reduce((acc, item) => { const x = item.v; return acc + x; }, 0)` works), but the top-level expression is always a single expression.

### What's allowed / forbidden

The full, current allow/forbid surface — allowed syntax, shadowed globals, the arrow-body statement tolerance, and (importantly) the **security limits** of static AST filtering — lives in [`EXPRESSIONS.md`](./EXPRESSIONS.md). In short: a single JS expression with member/computed access, arithmetic/logical/ternary, object/array/template literals, arrow callbacks, `await`, and calls to host functions; no ambient globals, no statements at the top level, no *static* `constructor`/`__proto__` access.

> **Read the "Security" section of [`EXPRESSIONS.md`](./EXPRESSIONS.md):** the evaluator is best-effort, **not** a containment boundary — a dynamically-computed property key escapes it. Treat expression authors as semi-trusted.

### How it's compiled

`SafeEval.compile()`:

1. `validate()` parses + walks the AST, throws on anything forbidden, and extracts `scopeReads` (§8).
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

All mutable state lives in `createProxyScope`. Each *scope* is one instance: the root scope, one per list item, one per nested-list item.

For the mechanics of the proxy itself — reads, writes, the emitter, identity, and the path-exact subscription model — see [`SCOPES.md`](./SCOPES.md). The rest of this section covers how the render runtime *uses* the proxy.

### `$set`, `$emitter` at the scope root

Only the proxy at `path.length === 0` exposes the framework hooks:

- `proxy.$emitter` — the emitter ref. Subscribers do `scopes.<scopeName>.$emitter.on(path, handler)`.
- `proxy.$set(path, value, options?)` — walks the dotted path creating intermediate objects as needed; the final assignment goes through the `set` trap (so it emits). Used by `callbacks` from inside the renderer. Pass `{ default: true }` for init-if-absent: no-op if the leaf already has a value. `defaults` lower to `$set(..., { default: true })`, so two components seeding the same path don't clobber each other (first-writer-wins).

Sub-proxies (`scopes.inv.rows`, `scopes.inv.rows[0]`, etc.) don't expose `$emitter` / `$set`; the emit goes to the parent scope's shared emitter.

### Writer convention

The runtime is path-exact. **Replace arrays / objects wholesale** in callbacks so any reader of the parent path wakes. Granular leaf-writes (`proxy.$set("rows.0.name", "x")`) only wake readers that subscribed to that exact leaf path. See [`SCOPES.md`](./SCOPES.md) §3 for the full rules.

---

## 7. Scopes & nested scopes

`scopes` is a flat, named bag of reactive proxies: `scopes.root` (page-wide) plus one scope per list item, named by the list's `as`. Nesting is expressed by naming and composition, not deep `scopes.a.b` objects — an inner subtree sees every enclosing scope, a list is *N* scope instances (one proxy per row, cached by item id), and a parent reads across rows via `childScopes.<as>`. Scope names must be globally unique across lists.

See [`SCOPES.md`](./SCOPES.md) — *Usage: the scope architecture* — for the full model: the flat-bag shape, per-item scopes, `childScopes` aggregation, and the lexical mental model.

---

## 8. Reactivity — auto-detected deps

For each element, the renderer subscribes to every scope path the element *reads* in its **reactive sites**:

- `element.props.expr`
- `element.hidden`
- `element.each` (list elements)

`defaults` and `callbacks` are NOT scanned: defaults run once at mount (gated by `hasBeenRenderedRef.current`); callbacks run on event and read current state at fire time.

### The pipeline

1. `SafeEval.validate(expr)` runs the acorn parse + AST walk. Same pass extracts every `scopes.X.Y` chain it sees. Stops a chain at the first `CallExpression` callee segment (`.filter` etc.), `ComputedMember`, or non-Identifier property. Recurses into call arguments and computed-key sub-expressions so reads inside `.filter(r => …scopes.root.x…)` are still captured.
2. `safeEval.scopeReads(expression)` returns the cached `string[]`.
3. `extractDeps(element)` unions the read sets across all reactive sites of one element and caches the union in a `WeakMap<ComponentEntry, string[]>` so the per-render lookup is O(1).
4. The binding subscribes: for each dep, `parseScope(dep)` → `[scope, path]`, then `scopes[scope].$emitter.on(path, notify)`. In the React binding `notify` is a `forceRender` (see [`REACT.md`](./REACT.md) §2); a different binding wires its own reactivity to the same `$emitter`.

### Why static AST

Two practical properties:

- **No over-subscription.** Only paths the expression actually reaches as data are recorded. Method-call segments are dropped (`scopes.inv.rows.filter(...)` yields `scopes.inv.rows`, not `scopes.inv.rows.filter`). String-literal contents are not matched. Result: subscribers fire on real path-writes, never on unrelated state changes.
- **No expression execution.** Other options (Proxy-based runtime tracking) would have to run the expression body to harvest reads — and would record method-dispatch gets (`.filter`, `.map`) as deps, causing dead subscriptions. Static AST sidesteps this.

The "missed dynamic-key access" case is real but currently a non-issue: the LLM prompt forbids `scopes[var]`, and no current element uses it. If/when this is needed, fall back to enumerating `Object.keys(scopes)` and subscribing to the static suffix on each.

### Path-exact subscription, no bubble

Subscribers register on the *exact* dep string. Writers emit on the exact `set` path. Reader-writer agreement is by path equality. The renderer never tries to bubble or fan out by prefix — the `createProxyScope` set trap emits one event at one path, and `extractDeps` records the leaf path; both ends meet.

This means **the LLM's writer convention matters**. If a callback's `set` targets `scopes.inv.rows` with a new array (the runtime lowers that to `scopes.inv.$set("rows", newArr)`), every reader of `scopes.inv.rows` (whether via `.length`, `.map`, `.filter`, etc.) wakes. If it instead targets `scopes.inv.rows.0.name`, only readers of that exact path wake. Current callbacks write wholesale.

---

## 9. Defaults & callbacks

> Authoring semantics — what `defaults` / `callbacks` are *for*, the `{ set, expr, confirm }` shapes, the purity rule — live in [`LINES.md`](./LINES.md). This section covers how the **runtime executes** them.

### `defaults`

Run **once**, when the element first mounts. Gated by `hasBeenRenderedRef.current`. Each entry is an `ValueSourceAssignment`:

```ts
{ "set": "scopes.root.users", "expr": "UserRPC_getUsers()" }
```

Four things to notice:

1. **All defaults in one element are evaluated BEFORE any value is written.** They're collected, then written. So a later default *cannot* read a value set by an earlier default in the same element. If you need that chaining, split across parent/child elements (child mounts after parent finishes).
2. **Async defaults suspend the element.** If any default expression returns a Promise, the element suspends (rendering its placeholder) until all promises resolve. The suspension *mechanism* is the binding's — in React it's `<Suspense>` + `use(promise)` (see [`REACT.md`](./REACT.md) §5).
3. **No re-run on partial replacement.** An element re-emitted with the same key keeps its scope state — defaults don't fire again if the renderer instance survives.
4. **Use `defaults` for state, not derivations.** The right things to put in `defaults` are values the user (or a mount-time RPC) initializes once and the page then reads/mutates over its lifetime — form fields, selections, search terms, pagination cursors, raw fetched lists. Values *computed from* other state — a filtered list, sorted list, paginated slice, sum, formatted string — do not belong here; they go inline in `props.expr` / `hidden` / `each`, where auto-deps subscribes to the inputs and recomputes on change. A derivation in `defaults` is correct at mount and stale forever after. The LLM is taught this in [`INSTRUCTIONS.md` §3](../src/prompt/INSTRUCTIONS.md).

### `init` — host-side seeding (not an element field)

`defaults` is the LLM's tool for seeding state at mount. **`init` is the *host's* tool** for the same job — data the consuming app already has in memory (or can prefetch synchronously) at mount time and doesn't want the LLM to re-seed.

```tsx
<Renderer
  lines={elements}
  init={({ scopes }) => {
    scopes.root.headings = { customers: { customer: "Customer", email: "Email" } };
  }}
/>
```

`init` is a **prop on `<Renderer>`**, not an element field. It runs exactly once, before any LLM-emitted root element evaluates its `props`/`defaults`. Three things to know:

1. **Side effects only.** The callback's return value is ignored. Mutate via the reactive Proxy (`scopes.root.x = y`); the assignment routes through the same `set` trap as `$set` (see [`SCOPES.md`](./SCOPES.md)), so subscribers wake the same way.
2. **Sync vs async.** Sync writes land before children mount. If the callback returns a Promise (`async ({ scopes }) => { scopes.root.x = await fetch(...) }`), the wrapper suspends via the same async path string-form defaults use (above) — children mount only after it resolves.
3. **Fires once.** Same `hasBeenRenderedRef` guard that pins `defaults` to one shot. New elements streaming in re-render the Renderer; `init` does NOT re-fire.

Mechanically, the binding **always** wraps its root elements in a synthetic `{ component: "RootFragment", … }` element; `init` lands on that wrapper. See [`REACT.md`](./REACT.md) §2 for the wrap details.

`init` is intentionally narrower than `defaults`:

- **No `set` field.** The callback is a pure side-effect — hosts in TS can write arbitrarily complex objects to multiple paths in one call, no need to enumerate `{ set, expr }` pairs.
- **No reactivity.** Once `init` runs, it's gone. The state it wrote is reactive; the callback itself is not re-triggered by scope changes.
- **No LLM authoring.** The element model doesn't include `init` — it's a Renderer prop only. The LLM can't emit it and shouldn't try; `RootFragment` itself is registered with `hidden: true` so it never appears in the LLM-facing component menu (§12).

### `callbacks`

Triggered by component events. Each callback name maps to an array of `ConfirmableValueSourceAssignment`:

```ts
"onChange": [
  { "set": "scopes.root.q", "expr": "evt.value" },
  { "set": "scopes.root.results", "expr": "TaskRPC_search({ query: { q: scopes.root.q } })" }
]
```

Execution semantics:

- Steps execute **sequentially**. Each `await`s its expression before the next runs.
- Inside a callback expression, `evt` is bound to the event payload typed per the callback's def (`evt.value`, `evt.valueAsNumber`, etc.). The component renderer constructs the payload, and can shape it however it likes — DOM fields, a typed scalar, a structured or spatial/relational record — so this single mechanism covers any event source (see [`LINES.md`](./LINES.md#callbacks) §callbacks).
- `confirm`: if a step has `{ confirm: "Are you sure?", … }`, the binding opens a confirm modal before evaluating that step's expression (in React, the host-supplied `systemVisuals.confirm` modal — the catalog ships `ConfirmModal` — else the browser-native `window.confirm`; see [`REACT.md`](./REACT.md) §2). On cancel, the step **and all subsequent steps** are skipped. Place `confirm` on the first dangerous step.
- A small `await new Promise(resolve => setTimeout(resolve, 0))` yields between steps so the scheduler can pick up the previous `$set` before the next one fires — avoids a race where a derived dep update lags the next chained expression's read.

### The purity rule

Expressions must be **pure** — the only sanctioned way to write state is the `set` field on `defaults` / `callbacks`. Full rationale and the IIFE caveat are in [`LINES.md`](./LINES.md#the-purity-rule); the LLM is taught it in [`INSTRUCTIONS.md` §2](../src/prompt/INSTRUCTIONS.md).

---

## 10. Lists

> The `each` / `as` / `keyBy` line properties are defined in [`LINES.md`](./LINES.md). This section covers the list-iteration semantics; the per-item React mounting is the binding's (`ListRenderer` — [`REACT.md`](./REACT.md) §2).

List iteration is the workhorse of the runtime:

1. **Subscribe to deps** (auto-extracted from `each` + the list element's own `props`/`hidden`) — typing in a search input drives a `$set` on the searchTerm path, which wakes the list, which re-evaluates `each` and re-renders.
2. **Evaluate `each`**: `evaluate({ expr: line.each }, { scopes }, { functions })`. Returns the items array; `?? []` if undefined.
3. **Compute item ids** via `getItemId(keyBy, item, index)`. Default is `_index` (positional); `_item` uses the value itself (good for primitive arrays); a string key reads `item[key]`. **Use a stable key when items are objects** — without it, edits-in-place can shift positions and lose per-item state.
4. **Prune the proxy cache** — items removed from the source array have their cached proxies dropped so memory is bounded.
5. **For each item**, look up or create the per-item proxy. Mutate `(itemProxy as any).item = item` and `.index = index` so the values reflect the latest source array (existing item, new value or position).
6. **Render** the list element once per item with `itemScopes = { ...scopes, [line.as]: itemProxy }`. The same `elementKey` is passed for each — each item renders the list element *itself* as its root, with the item scope wired in.
7. **Publish** `childScopes.${as} = itemProxiesList` on the parent scope for cross-item aggregation.

The list element's `component` is rendered **once per item**. There's no separate "list container" component for the list itself — the parent element that *contains* the list provides the container (e.g. a `TableBody` parent with a `TableRow` list child).

---

## 11. Rendering pipeline

The pipeline that mounts an element tree — the `<Renderer>` component (which builds the catalog map from its `implementations` array prop), the `RendererRegistry` context, the `RecursiveRenderer` + `createComponentImplementation` tree walk, the synthetic `RootFragment` that hosts `init`, and `<Suspense>` / `<Activity>` — is **React-specific and lives in the binding**: see [`REACT.md`](./REACT.md) §2 (with §4–§5 for the `<Activity>` / `<Suspense>` mechanics). The engine concepts it builds on — the element model (§4), `evaluate` (§5), auto-detected deps (§8), `createProxyScope` (§6), and list iteration (§10) — are documented here; [`REACT.md`](./REACT.md) §7 lists the exact engine surface a binding consumes.

---

## 12. Component registration — def + impl

A renderable component is a pair of declarations, conventionally co-located in the consuming catalog. The **def** half is agnostic and lives in core; the **implementation** half is React and lives in `@ui-fired/react`.

### `def.ts` — the *partner module* the LLM reads

```ts
import { createComponentDefinition } from "@ui-fired/core";
import z from "zod";

export const InputDef = createComponentDefinition({
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

The def's `description` and the JSON-Schema of its props / callbacks get serialized into the LLM prompt via `getComponentsPartialPrompt()`, which renders Zod schemas to TypeScript-like type strings using `JSONSchemaToTs`.

### `impl.tsx` — the actual React component

The implementation half of the pair is React and lives in `@ui-fired/react`, paired with the def via `createComponentImplementation`. See [`REACT.md`](./REACT.md) §3 for the `impl.tsx` shape and how its signature is typed against the def.

### Registration

The consumer maintains two registries:

- `componentDefinitions` — a flat array of defs (`[InputDef, …]`, assembled in the consumer's `defs.ts`). Drives the prompt; `getComponentsPartialPrompt` throws on a duplicate `name`. (core)
- `componentImplementations` — array of implementations passed to `<Renderer implementations={…}>`, which builds the name → implementation map. (React binding)

**Adding a component requires updating both maps.** There's no codegen step linking them — discipline only.

### Hiding host-only defs from the LLM

`createComponentDefinition` accepts an optional `hidden?: boolean`. Defs marked `hidden: true` are kept in the renderer registry (so elements referencing them mount correctly), but **`getDefPartialPrompt()` filters them out** of both the "# Available Components" name list and the "# Component Details" schema dump. Use for host-managed infrastructure that should never appear in the LLM's component menu.

Today the only `hidden` def is `RootFragment` (see §9 / [`REACT.md`](./REACT.md) §2) — the synthetic wrapper used to host the `Renderer.init` callback. It's auto-merged into the catalog map by `<Renderer>`, so consumers don't have to register it manually.

---

## 13. Host functions

A host can expose bare-identifier functions to every expression inside the tree via the `functions` prop on `<Renderer>`:

```tsx
<Renderer lines={elements} functions={hostFunctions} />
```

`functions` is typed as `StandardTool[]` (from the `standard-tool` package) — each tool is `{ name, description, inputSchema?, execute(input) }`, and the evaluator exposes `tool.execute` under `tool.name` as a bare callable. The same array also feeds the prompt's function list, so one representation drives both runtime and prompt.

### How they're threaded

1. `<Renderer functions={…}>` puts them into the registry value.
2. The binding reads them at every evaluate site (in React, via `useRendererRegistry()`).
3. `evaluate()` spreads them into the eval context **after** `context`, so a host function wins over an equally-named scope variable.

From inside an expression:

```ts
setCell({ a1: 'Sheet1!A1', value: scopes.row.item.total })  // resolves async
```

works because `setCell` is in the eval context as a bound callable. RPC-style functions return promises; in callbacks the renderer awaits each step before proceeding.

### When to use

Use host functions for **runtime CRUD against the user's data** or anything that needs context the element producer can't have (auth tokens, browser-only APIs). Don't use them as a back door to mutate scope state — `set` is the way.

---

## 14. Partial replacement

To fix a bug in an emitted element subtree, re-emit the element with the **same key**. `buildElementsById` detects the duplicate key, walks the *old* element's descendants via `collectDescendantIds`, deletes them from the map, then inserts the new element in place. Any new children the re-emitted element references must be emitted afterwards as usual.

Properties to know:

- **State above the replaced subtree is preserved.** Only the subtree re-mounts; ancestor scopes are untouched.
- **Sibling elements not in the new `children` array are dropped.** If the old element had children `[A, B, C]` and the new has `[A, D]`, the *whole* old subtree of A/B/C and below is wiped, then the new A/D get rendered fresh. There's no per-child diff.

The pattern is meant for *correcting mistakes mid-stream*, not for ongoing reactive updates. Reactive updates flow through `set` + auto-deps.

---

## 15. Hidden — conditional visibility

`element.hidden` is a bare expression evaluated every render; truthy hides the element. The engine treats it as a reactive site (§8), so writing the path it reads flips visibility. The **mechanism** — React 19's `<Activity>`, which keeps the subtree mounted with state intact rather than unmount/remount, so input focus / scroll / expanded toggles survive — is the binding's: see [`REACT.md`](./REACT.md) §4. The `hidden` line property itself is in [`LINES.md`](./LINES.md).

---

## 16. Performance notes

- **Expression parse** — once per unique expression string, cached on `SafeEval.#cache` (LRU @ 500 entries default). Subsequent compiles / evaluates are O(1) cache hits. Acorn parse of a 30-100 char expression is ~10-25 μs; the cached path is sub-microsecond.
- **`extractDeps`** — `WeakMap<ComponentEntry, string[]>`. One walk per element reference, free thereafter.
- **Proxy cache** — `WeakMap<object, object>` (see [`SCOPES.md`](./SCOPES.md)). Same source object → same proxy reference. Cheap subscribe / unsubscribe across re-renders because handler-set membership is by reference.
- **No virtual-DOM diffing of derived state** — instead of recomputing every prop every render, the proxy emits exactly one event per write, and only the elements subscribed to that path re-render.
- **Re-render granularity & item-proxy durability** — binding-specific; see [`REACT.md`](./REACT.md) §6. (The engine emits one event per write; the binding decides what re-renders.)

---

## 17. Authoring a new AI component

1. Pick a name (PascalCase, matches the LLM-visible component string).
2. Create `<Name>/def.ts` with `description`, `propDefs`, `callbackDefs`.
3. Create `<Name>/impl.tsx` pairing the def with the React render function.
4. Register in your catalog's `defs.ts` and `impls.ts`. Both maps must include the new entry — without both, the LLM either can't produce the component or can produce but not render it.
5. If the component has nontrivial events, define the event payload schema with Zod meta-descriptions so the LLM knows the field names it'll see in `evt`.

`propDefs` is the contract with the LLM. Use `.meta({ description: "…" })` on every field so the LLM has enough information to fill it in correctly. Mark optional fields with `.optional()` and supply sensible `.default()` values where applicable.

---

## 18. What is NOT in core

For boundary clarity:

- **React (any UI framework)** — the renderer, the registry context, `<Suspense>` / `<Activity>` mechanics, confirm UI live in `@ui-fired/react`, not core. Core has zero React imports. See [`REACT.md`](./REACT.md).
- **Specific components** — Card, Input, Table, etc. live in the consuming catalog, not in core. Adding them in core is wrong even if you imagine they're "primitives."
- **Persistence** — core doesn't know about Prisma, DB schemas, or persisted-row tables. Consumers handle the round-trip: serialize elements on stream, rehydrate from rows on cold load, feed back into `<Renderer lines={...} />`.
- **Prompt assembly** — core ships catalog-agnostic partial-prompt builders (`getCommonInstructionsPartialPrompt`, `getComponentsPartialPrompt`, `getFunctionsPartialPrompt`); the consuming app composes them into its full system prompt — joining them per endpoint, inline, to form each `system` message. Any example element fixtures are catalog-flavoured content, not core.
- **RPC / external APIs** — core knows the shape of host functions (`StandardTool[]`) but doesn't ship any. The consumer passes them in via the `<Renderer functions={...} />` prop.
- **Auth / sessions** — consumer concern. Core runs the same way whether the user is signed in or not.

When in doubt, ask: "Would a different consumer of core (a future product line, a unit test, a non-React binding) also need this?" If yes — core. If no — consumer/binding.

---

## Cross-references

- [`REACT.md`](./REACT.md) — the reference React binding (`@ui-fired/react`): the render pipeline, `<Activity>` / `<Suspense>`, and the binding seam.
- [`SPEC.md`](./SPEC.md) — the normative ui-fired format contract.
- [`LINES.md`](./LINES.md) — per-property authoring reference for each line field.
- [`EXPRESSIONS.md`](./EXPRESSIONS.md) — expression syntax + the evaluator's security limits.
- [`SCOPES.md`](./SCOPES.md) — the reactive proxy state library underneath all of this.
- LLM-facing contract for elements: [`../src/prompt/INSTRUCTIONS.md`](../src/prompt/INSTRUCTIONS.md)
- The expression guardrail + evaluator: [`../src/expr/validate.ts`](../src/expr/validate.ts) (the checks) and [`../src/expr/safe-eval.ts`](../src/expr/safe-eval.ts) (compile + run) (+ `ast-utils.ts`, `analyze.ts`, `globals.ts`)
- The auto-detection helper: [`../src/expr/extract-deps.ts`](../src/expr/extract-deps.ts)
