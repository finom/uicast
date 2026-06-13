# Lines — the element properties

A generated page is a stream of **lines**: one JSON object per line (JSONLines),
each an **element** (`ComponentEntry`). This document is the **per-property
reference** — what every field on a line is, and how to author it.

Scope of the sibling docs:

- **This doc** — what each line property means and how to fill it in.
- [`SPEC.md`](./SPEC.md) — the normative format contract this doc details
  per-field (the element model, streaming, encoding, conformance).
- [`EXPRESSIONS.md`](./EXPRESSIONS.md) — the JavaScript expression syntax used by
  any `expr` field below (`props`, `hidden`, `defaults`, `callbacks`, `each`).
- [`SCOPES.md`](./SCOPES.md) — the reactive `scopes` state model those
  expressions read from and write to.
- [`OVERVIEW.md`](./OVERVIEW.md) — how the engine *executes* these lines
  (reactivity, suspension, list iteration). This doc is the authoring contract;
  OVERVIEW is the machinery.
- [`REACT.md`](./REACT.md) — the reference React binding that mounts these lines
  (the `<Renderer>`, `<Activity>` / `<Suspense>`).

---

## The shape

A line is a `ComponentEntry`. One element type describes every line — the list
fields are optional, so a line **is a list iff it carries `each`**. The list
refinement is `ComponentListEntry` (`each`/`as` required); narrow in TS with
`isComponentListEntry(el)`.

```ts
interface Element {
  key: string;                 // unique id; partial replacement keys off this
  component: string;           // registry name, e.g. "Card", "Input", "Table"
  props?: ValueSource;         // evaluates to the component's props object
  defaults?: ValueSourceAssignment[];            // one-shot state seeding
  hidden?: Expression;         // bare expr; truthy → hide (state preserved)
  callbacks?: Record<string, ConfirmableValueSourceAssignment[]>; // event → steps
  children?: string[];         // child line keys, in render order
  // List fields — present iff this element repeats (`each` is the marker):
  each?: Expression;           // array to iterate — its presence marks a list
  as?: string;                 // globally unique scope name for each item
  keyBy?: "_index" | "_item" | (string & {});    // per-item identity
}

// A list is an element that repeats — the same shape, with each/as required.
interface List extends Element {
  each: Expression;
  as: string;
}
```

The value forms those fields use:

```ts
type Expression = string;   // bare JS, always evaluated
type ScopePath  = string;   // dotted path into `scopes` — a write target, e.g. "scopes.root.users"
type ValueSource = { expr: Expression } | { literal: unknown };
type ValueSourceAssignment = { set: ScopePath } & ValueSource;
type ConfirmableValueSourceAssignment = { confirm?: string } & ValueSourceAssignment;
```

- **`{ literal: X }`** — `X` is used verbatim (any JSON value). No evaluation;
  use it when nothing depends on state.
- **`{ expr: "<JS>" }`** — evaluate the expression against the current scopes;
  the result is the value. Syntax → [`EXPRESSIONS.md`](./EXPRESSIONS.md).
- **`{ set: "scopes.X.Y", … }`** — additionally write the result to that scope
  path, a `ScopePath` (the only sanctioned way to write state — see *Purity*
  below).
- **`{ confirm: "…?", … }`** — gate the step on a modal Yes/No before it runs.

---

## Element properties

### `key` (required)
A unique string id for the line, written in **kebab-case** (lowercase words
joined by hyphens — `"user-card"`, `"stats-row"`, never `"userCard"`). The tree
is built by key reference, and **partial replacement** keys off this:
re-emitting a line with the same `key` replaces that subtree in place (see
[`OVERVIEW.md`](./OVERVIEW.md) §14).

```jsonc
{ "key": "user-card" }
```

### `component` (required)
The registry name of the component to render (`"Card"`, `"Input"`, `"Table"`,
…). Must exist in the renderer registry, or the line can't mount.

```jsonc
{ "component": "Card" }
```

### `props`
A [`ValueSource`](#the-shape) that evaluates to the component's props object —
wrap object literals in parens. A reactive site: the runtime auto-subscribes to
every `scopes.X.Y` the expression reads and re-renders on change. Authoring
examples → [`EXPRESSIONS.md`](./EXPRESSIONS.md).

```jsonc
{ "props": { "expr": "({ text: scopes.root.title })" } }   // computed from state
{ "props": { "literal": { "variant": "outline" } } }       // static, never evaluated
```

### `children`
An array of child line `key`s, in render order. Absent/empty means no children
(leaf). The actual child lines are separate JSONL lines referenced by key.

```jsonc
{ "children": ["row-1", "row-2", "row-3"] }
```

### `hidden`
A bare [`Expression`](#the-shape) (no `literal` form). When it evaluates truthy
the line is hidden — but **kept mounted with its state** (React `<Activity>`),
so toggling visibility never loses input focus, scroll, or expanded state.
A reactive site, like `props`. Use for tabs, accordions, conditional panels.
The hide *mechanics* live in [`OVERVIEW.md`](./OVERVIEW.md) §15.

```jsonc
{ "hidden": "!scopes.root.showDetails" }
```

### `defaults`
An array of [`ValueSourceAssignment`](#the-shape) that **seed scope state once**,
when the line first mounts.

```jsonc
{ "set": "scopes.root.users", "expr": "await UserRPC_getUsers()" }
```

Authoring rules:

1. **Run once, at mount.** Re-renders don't re-run them; a partial-replacement
   re-emit with a surviving instance keeps its state and does not re-seed.
2. **All defaults in one line are evaluated BEFORE any is written.** A later
   default *cannot* read a value an earlier default in the **same line** set.
   Need that chaining? Split across parent/child lines — the child mounts after
   the parent.
3. **Use `defaults` for state, not derivations.** Put values that get
   *initialized once then read/mutated* here — form fields, selections, search
   terms, fetched lists. Values *computed from* other state (a filtered list, a
   sum, a formatted string) do **not** belong here — they go inline in `props` /
   `hidden` / `each`, where auto-deps recompute them on change. A derivation in
   `defaults` is correct at mount and stale forever after.
4. **Async defaults suspend the line.** If an expression returns a Promise the
   line suspends (showing its placeholder) until it resolves — mechanics in
   [`OVERVIEW.md`](./OVERVIEW.md) §9.

> `defaults` is the line author's tool for seeding state. The **host** has a
> parallel tool, `init` — a prop on `<Renderer>`, not a line property — for
> seeding data the app already holds. See [`OVERVIEW.md`](./OVERVIEW.md) §9.

### `callbacks`
A map of event name → an array of [`ConfirmableValueSourceAssignment`](#the-shape)
steps, run when the component fires that event.

```jsonc
"onChange": [
  { "set": "scopes.root.q", "expr": "evt.value" },
  { "set": "scopes.root.results", "expr": "await TaskRPC_search({ query: { q: scopes.root.q } })" }
]
```

Authoring rules:

- **Steps run sequentially**, each awaited before the next — so a later step can
  read a path an earlier step `set`.
- **`evt`** is bound inside callback expressions to the event payload, typed per
  the component's callback def (`evt.value`, `evt.valueAsNumber`, …).
- **`confirm`** on a step opens a Yes/No modal before that step; on cancel, that
  step **and all later steps** are skipped. Put it on the first dangerous step.
- A step with no `set` runs purely for its effect (e.g. a host-function call).

**`evt` is component-defined.** A component constructs `evt` however it likes —
its shape is declared in the component's callback def (a Zod schema, surfaced to
the model in the prompt) and is whatever that component chooses to pass. It can
carry DOM-style fields (`evt.value`, `evt.valueAsNumber`, click coordinates), a
single typed scalar, a structured record (`{ hex, h, s, l }`), or a
spatial/relational payload (`{ id, x, y }`, `{ from, to }`). There is **no
separate "custom event" API** — this one `callbacks` mechanism handles DOM
events, typed component events, and synthetic payloads uniformly; the expression
just reads whatever the component put on `evt`. That is why callbacks cover the
full range of event handling: a component can model any interaction as an event
carrying exactly the payload its handler needs.

---

## List properties

A line becomes a list by carrying `each`. The list `component` renders **once
per item**; there's no separate "list container" component — the parent line
that contains the list provides the container. Iteration mechanics (item-proxy
caching, `childScopes` aggregation) live in [`OVERVIEW.md`](./OVERVIEW.md) §10.

### `each` (required for a list)
A bare [`Expression`](#the-shape) returning the array to iterate (`?? []` if it
returns undefined) — typically just a **reference** to a state array
(`scopes.root.orders`), which is the form the prompt asks for. Because it's an
expression, an inline array-returning expression (a `.filter()`/`.sort()`) also
works for a *derived* list. A reactive site — writing a path it reads re-runs
the list.

```jsonc
{ "each": "scopes.root.orders", "as": "order", "component": "OrderRow", … }
```

### `as` (required for a list)
The scope name each item is exposed under, inside the item's subtree
(`scopes.<as>.item`, `scopes.<as>.index`). **Must be globally unique** across all
lists on the page — scopes are a flat bag (see [`SCOPES.md`](./SCOPES.md)).

```jsonc
{ "as": "row" }   // each item readable at scopes.row.item / scopes.row.index
```

### `keyBy`
How to derive a stable identity per item: `"_index"` (default; positional),
`"_item"` (the value itself — good for primitive arrays), or a property name
string (reads `item[key]`). **Use a stable key for object items** — without it,
in-place edits can shift positions and lose per-item state (focus, edit mode).

```jsonc
{ "keyBy": "id" }   // identity = item.id  (vs "_index" default, or "_item")
```

---

## The purity rule

Every `expr` — in `props`, `hidden`, `defaults`, `callbacks`, `each` — must be a
**pure** expression: it computes and returns a value, nothing more. The **only**
sanctioned way to write state is the `set` field on a `defaults` / `callbacks`
entry.

Mutating scope from inside an expression body — e.g. the IIFE form
`(() => { scopes.x = y; return … })()` — creates a write-during-render that the
renderer re-evaluates and re-fires, producing infinite loops or stale state. The
evaluator's ban on top-level assignment catches the direct `scopes.x = …` form
but **not** the IIFE form, so treat purity as a contract, not an enforced rule.
(See [`EXPRESSIONS.md`](./EXPRESSIONS.md) for what the evaluator does and doesn't
enforce.)
