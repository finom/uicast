# ui-fired — format specification

> **Status: draft.** This is the top-level, normative definition of the
> **ui-fired** format. It is **layered**, and the layers are independent:
>
> 1. **[Model](#1-model)** — the encoding-independent shape of a UI: elements,
>    their fields, the tree they form, the value/expression sub-language. The
>    model knows nothing about JSONL or streaming.
> 2. **[Streaming](#2-streaming)** — how a document is delivered and patched:
>    ordering, partial replacement, suspension. Independent of the wire encoding.
> 3. **[Encoding](#3-encoding)** — how the model is serialized: JSON Lines.
>
> This document defines *what the format is*. The companion docs are the
> detailed, non-normative references for *how it works*:
> [`OVERVIEW.md`](./OVERVIEW.md) (engine runtime mechanics), [`LINES.md`](./LINES.md)
> (per-property authoring reference), [`EXPRESSIONS.md`](./EXPRESSIONS.md) (the
> expression sub-language + its security limits), [`SCOPES.md`](./SCOPES.md) (the
> reactive state model), [`REACT.md`](./REACT.md) (the reference React binding),
> and [`../src/prompt/INSTRUCTIONS.md`](../src/prompt/INSTRUCTIONS.md)
> (the contract a generator must obey). Where this spec and a companion disagree,
> this spec wins for the model/streaming/encoding *contract*; the companion wins
> for mechanism detail.

---

## 0. Terms

- **ui-fired** — this format. A user interface described as a flat set of
  **elements** that form a tree, plus a reactive state model the elements read
  from and write to. Not a protocol: there is no interactive request/response
  exchange — a producer emits a document, a runtime renders it.
- **element** — the unit of the format. One node of the UI tree, of type
  `Fired.Element`. Carries an identity (`key`), a `component` to render, and
  optional inputs (`props`), state seeds (`defaults`), visibility (`hidden`),
  event handlers (`callbacks`), and `children`.
- **list** — an element that **repeats**: it carries an `each` (the collection)
  and an `as` (the per-iteration scope name). Type `Fired.List`. Each repetition
  is an **item**.
- **document** — a complete set of elements describing one UI tree (exactly one
  root, every other element referenced as a child exactly once).
- **scope** — a named, reactive state bag. There is one root scope and one scope
  per list item; see [§1.5](#15-state--scopes).
- **expression** — a single host-language (JavaScript) expression string,
  evaluated against the current scopes. The format's only dynamic surface.

---

## 1. Model

The model is **encoding-independent**: a set of elements forming a tree, plus the
value/expression sub-language they use. It says nothing about JSONL, line order,
or how the document arrives. The canonical type definitions live in
[`types.ts`](../src/types.ts) under the `Fired` namespace.

### 1.1 Element

An element is one node:

| Field | Required | Meaning |
|---|---|---|
| `key` | yes | Unique identity within the document. Partial replacement keys off this ([§2.2](#22-partial-replacement-patch)). |
| `component` | yes | Name of the component to render; must exist in the consuming runtime's registry. |
| `props` | no | A [value source](#12-value-sources--assignments) evaluating to the component's props. |
| `defaults` | no | [Assignments](#12-value-sources--assignments) that seed scope state once, at mount. |
| `hidden` | no | A bare expression; truthy → the element is hidden but kept mounted (state preserved). |
| `callbacks` | no | Map of event name → ordered list of assignments, run when the component fires that event. |
| `children` | no | Ordered list of child element `key`s (render order). |
| `each` | no | **List marker.** Expression yielding the collection to iterate. |
| `as` | no | **List only.** Name of the per-item scope (`scopes.<as>.item`, `scopes.<as>.index`). |
| `keyBy` | no | **List only.** Per-item identity: `"_index"`, `"_item"`, or a property name. |

There is **one** element type. `each` / `as` / `keyBy` are optional on every
element; a `Fired.List` is the same shape with `each` and `as` required. There
is no `kind` discriminator — see [§1.3](#13-the-tree).

### 1.2 Value sources & assignments

A **value source** produces a value, one of two forms:

- `{ "literal": X }` — `X` is used verbatim (any JSON value), no evaluation.
- `{ "expr": "<expression>" }` — the [expression](#14-expressions) is evaluated;
  its result is the value.

An **assignment** is a value source plus a write target: `{ "set": "<ScopePath>", … }`,
where `ScopePath` is a dotted path into a scope (e.g. `"scopes.root.users"`).
Writing through `set` is the **only** sanctioned way to mutate state
([§1.4](#14-expressions)). An assignment may additionally carry `{ "confirm": "…?" }`
to gate the write behind a yes/no confirmation.

`defaults` are assignments; `callbacks` are assignments that may carry `confirm`.

### 1.3 The tree

Elements form a tree by **reference**, not nesting: an element lists its
children's `key`s in `children`; the children are separate elements. Two
structural rules, both with **no marker field**:

- **Root** — the single element whose `key` appears in no other element's
  `children`. Derived structurally, not flagged.
- **List-ness** — an element is a list **iff** it carries `each`. Derived
  structurally, not flagged (`Fired.isList(el)` ⇔ `each` present).

A document MUST have exactly one root; every non-root element MUST be referenced
as a child exactly once. A list MUST NOT be the root.

### 1.4 Expressions

`props.expr`, `hidden`, `each`, and the `expr` of any `defaults`/`callbacks`
assignment carry a single host-language expression. Two invariants:

- **Purity.** An expression computes and returns a value; it MUST NOT mutate
  state or cause side effects. State changes happen only through `set`
  ([§1.2](#12-value-sources--assignments)).
- **Automatic reactivity.** A reactive site (`props.expr`, `hidden`, `each`)
  auto-subscribes to every scope path it reads; when any is written, the site
  re-evaluates. Producers do not declare dependencies.

`defaults`/`callbacks` expressions may be asynchronous (await host calls);
reactive-site expressions MUST be synchronous. The expression sub-language, and
the deliberate limits of its sandbox, are specified in
[`EXPRESSIONS.md`](./EXPRESSIONS.md).

### 1.5 State (scopes)

State lives in **scopes**, a flat namespace of reactive bags. There is exactly
one **root scope** (`scopes.root`) and one scope **per list item**, named by the
list's `as`. There is no other kind of scope — UI-only flags live in `scopes.root`
like any other state. Scope names (the `as` values) MUST be globally unique
across the document. The state model and its reactive proxy are specified in
[`SCOPES.md`](./SCOPES.md).

---

## 2. Streaming

A document is a *sequence* of elements. The streaming layer defines how that
sequence is interpreted as it arrives — independent of the wire encoding.

### 2.1 Ordering

Elements MUST be emitted so that a parent appears **before** any element it
references in `children`. By convention the root is emitted first, then a
depth-first walk of its subtree. A reader MAY begin rendering before the document
is complete (placeholders stand in for not-yet-seen children).

### 2.2 Partial replacement (patch)

Re-emitting an element with an **already-seen `key`** replaces that element and
its entire subtree in place; any prior children not referenced by the new element
are discarded. State seeded by surviving ancestors is preserved, and `defaults`
on a surviving instance do **not** re-run. This is the format's only patch
operation — there is no explicit delete or move. Mechanics:
[`OVERVIEW.md`](./OVERVIEW.md) §13–§14.

### 2.3 Suspension

An async `defaults` assignment makes its element **suspend** (render a
placeholder) until the value resolves; children mount once every seed resolves.
Suspension is a runtime concern; the model and encoding are unaffected.

---

## 3. Encoding

The model ([§1](#1-model)) and streaming ([§2](#2-streaming)) layers are defined
without reference to any serialization — the format is the *model*; an encoding
is just how a document's elements are written down and ordered on the wire.
ui-fired uses one: **JSON Lines**.

One element per line, each line a complete, independently-parseable JSON object;
no enclosing array, no code fences, no surrounding prose. Line order is element
order ([§2.1](#21-ordering)).

JSONL fits the format: it streams naturally (a line is a unit), each line parses
on its own (a truncated stream is still valid up to its last newline), and it
maps 1:1 to "a document is a sequence of elements."

> Streaming **envelopes** (per-line metadata, framing, a union of an element with
> a meta record) are explicitly **out of scope** for core and for this spec: they
> belong to whatever transport a consuming app wraps a document in. Core is
> transport-agnostic.

---

## 4. Conformance

- A **conforming document** satisfies the model ([§1](#1-model)): exactly one
  root, every non-root referenced once, lists carry `each` + `as`, no list at the
  root, expressions pure.
- A **conforming producer** emits a conforming document in a valid order
  ([§2.1](#21-ordering)) and treats every expression as pure
  ([§1.4](#14-expressions)). The generator contract is
  [`INSTRUCTIONS.md`](../src/prompt/INSTRUCTIONS.md).
- A **conforming runtime** derives root/list-ness structurally
  ([§1.3](#13-the-tree)), auto-subscribes reactive sites, applies partial
  replacement on duplicate keys ([§2.2](#22-partial-replacement-patch)), and
  isolates expression evaluation per [`EXPRESSIONS.md`](./EXPRESSIONS.md). The
  reference runtime is `@ui-fired/core`.
