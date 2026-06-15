# React binding — `@ui-fired/react`

This document is the **dev-facing** reference for the **React binding** of the
ui-fired engine. The engine itself — the element model, the expression
evaluator, the reactive Proxy scopes, dependency extraction, prompt builders —
is **framework-agnostic** and lives in [`@ui-fired/core`](./OVERVIEW.md) with
**zero React imports**. This package (`@ui-fired/react`) is what actually mounts
an element tree into a live React UI: the `<Renderer>`, the recursive tree
walk, the registry context, the per-element error boundary, the confirm host
(`window.confirm` by default, a host-supplied modal via the `components.confirm`
slot).

> **Read [`OVERVIEW.md`](./OVERVIEW.md) first.** It describes the engine
> concepts this binding realizes — the element model (§4), expressions +
> `SafeEval` (§5), the reactive Proxy (§6), scopes (§7), auto-detected deps
> (§8), and the `defaults` / `callbacks` / list **semantics** (§9–§10). A
> non-React binding (Vue, Svelte, vanilla DOM) would re-implement *this*
> document against the same engine; §7 below is the seam it would build on.

Companion docs: the **normative format contract** is [`SPEC.md`](./SPEC.md);
the per-line authoring reference is [`LINES.md`](./LINES.md); the expression
sub-language is [`EXPRESSIONS.md`](./EXPRESSIONS.md); the reactive state model is
[`SCOPES.md`](./SCOPES.md); the LLM-facing contract an element producer obeys is
[`../src/prompt/INSTRUCTIONS.md`](../src/prompt/INSTRUCTIONS.md).

---

## 1. Package layout

```
packages/react/src/
├── render/
│   ├── recursive-renderer.tsx          — RecursiveRenderer + ListRenderer (the tree walk)
│   ├── renderer.tsx                   — the <Renderer> component: builds the name→implementation map from the `implementations` array prop; per-instance root; wraps RendererRegistryProvider
│   ├── create-component-implementation.tsx  — renderer factory: pairs a core def with a React component
│   ├── renderer-registry.tsx           — React context: { implementations, components, functions }
│   ├── error-boundary.tsx              — per-element error boundary; renders the components.error slot (inline-styled zero-dep default)
│   └── fragment.tsx                   — host-only wrapper component + InitContext / InitFn types
├── components/
│   └── confirm.tsx                    — ConfirmHost (owns pending state) + ConfirmComponentProps (the public modal contract); defaults to window.confirm (the stateless shadcn modal lives in @ui-fired/catalog)
└── index.ts                           — the package's React surface (the only public entry)
```

Everything agnostic is imported from `@ui-fired/core`: the element types
(`ComponentEntry` / `ComponentListEntry`), `evaluate` / `extractDeps` / `parseScope`, `createProxyScope`, the
def factory `createComponentDefinition`, and `buildElementsById`. The binding
adds **only** React. `react` / `react-dom` are **peer** dependencies — the
consuming app owns the single React instance.

> **Strict boundary.** This package does **not** re-export anything from
> `@ui-fired/core`. Import agnostic symbols from `@ui-fired/core`, React symbols
> from `@ui-fired/react`. A catalog `impl.tsx` therefore imports
> `createComponentImplementation` from `@ui-fired/react`, `createComponentDefinition`
> from `@ui-fired/core`, and `cn` / `pickClick` from `@ui-fired/catalog`.

---

## 2. The rendering pipeline

Three layers stack inside the binding.

### Outer — `<Renderer>`

The implementations are a **prop** — an **array of `ComponentImplementation`**, symmetric with
`functions`. `<Renderer>` builds the name→implementation lookup itself; there's no
separate builder step:

```tsx
import { ConfirmModal } from "@ui-fired/catalog/components/ConfirmModal";
import { componentImplementations } from "@ui-fired/catalog/render/impls";
import { Renderer } from "@ui-fired/react";

<Renderer
  implementations={componentImplementations}                 // ComponentImplementation[]
  lines={elements}
  functions={hostFns}
  components={{ placeholder: SomeSpinner, confirm: ConfirmModal }} // optional host-supplied chrome
  init={hostInit}
/>
```

`<Renderer>` turns the array into the `Record<string, ComponentImplementation>` the
registry needs — keyed by `renderer.name` (=== the component name the generator
emits) — always merging in the host-only `Fragment` renderer. On a **duplicate
name the later renderer wins** (so `[...componentImplementations, MyCard]` overrides
`Card`) and a `console.error` is logged so accidental double-registration is
still loud.

**Stable reference matters:** the built map feeds the registry context, whose
identity must stay stable or every node re-renders. Pass a **module-const array**
(like `functions`); a freshly-built array each render (inline `[...]` /
`Object.values(...)`) would churn the context and re-render the whole tree. The
implementations are as injectable as `functions` — override or extend components freely.

Internally `<Renderer>`:

- **Builds + memoizes the name→implementation map** from the `implementations` array (last
  entry wins on a duplicate name + `console.error`; the host `Fragment` is merged
  in last). Memoized on the array identity — hence the stable-reference rule
  above. Fragment is host-only (`hidden: true` in its def), renders
  `<>{children}</>` with no wrapping DOM, and is the one component the synthetic
  wrapper below references by name.
- Memoizes the registry value (`{ implementations, components, functions }`) so context
  identity only changes when `implementations`, `functions`, or `components` changes.
- Creates **one `root` reactive proxy per instance** (`createProxyScope({})` from
  core, lazy-init via ref) — each mounted `<Renderer>` owns isolated state.
- `buildElementsById(lines)` (from core) flattens the JSONL into a key→element
  map, applying partial-replacement on duplicate keys (see
  [`OVERVIEW.md`](./OVERVIEW.md) §14).
- Derives root elements structurally (those whose `key` no other element lists
  in its `children`), dedupes by key, and assembles them as the `children` of a
  **single synthetic Fragment element** (`key: "__renderer_fragment__"`). The
  Fragment becomes the lone top-level mount; the AI roots are its children.
  Visually identical to the un-wrapped tree, but it gives the `init` prop
  exactly one mount point. The wrap happens whether or not `init` is provided —
  keeping tree topology consistent across init/no-init renders.
- Mounts the Fragment via `<RecursiveRenderer init={init} … />`. `init` is **not**
  propagated to recursive child mounts — only the top-level synthetic Fragment
  runs the callback; descendants always see `init=undefined`.
- Wraps the whole tree in `RendererRegistryProvider`, with a `<ConfirmHost>`
  between the provider and the tree. The host owns the pending-confirm state
  (one `Promise.withResolvers()` pair parked in state per open question) and
  keeps the `components.confirm` modal mounted next to the tree, driving it as
  a controlled dialog — so the modal itself stays stateless. No slot →
  `window.confirm`.

### Middle — `RendererRegistry` context

A React context carrying `{ implementations, components, functions }`. Every
component in the tree calls `useRendererRegistry()` to look up its implementation
by name, the host-supplied chrome (`components`), and the host functions to pass
into evaluator calls.

`components` (`RendererComponents`) is the host's map of engine "chrome" —
distinct from `implementations` (the catalog components). Four slots
are wired today:

- **`placeholder`** — shown for a not-yet-streamed child and as the
  async-`defaults` suspense fallback (§5). Precedence is **renderer's own
  placeholder → `components.placeholder` → null** (render nothing). Resolved
  per-node in `RecursiveRenderer`.
- **`confirm`** — the modal that resolves callback steps carrying `confirm:`
  (`ConfirmComponentProps`: `open` / `message` / `onConfirm` / `onCancel`).
  Resolved once, by `<Renderer>`'s `ConfirmHost`. Omitted → the browser-native
  `window.confirm`, so the engine renders with zero UI deps.
- **`unknown`** — replaces an element whose `component` has no renderer in the
  catalog (`UnknownComponentProps`: `componentName` / `elementKey`). Resolved
  per-node in `RecursiveRenderer`.
- **`error`** — replaces an element whose render threw, plus the not-a-list
  misuse of a list key (`ErrorComponentProps`: `error` / `elementKey?`).
  Rendered by the per-element `ErrorBoundary`.

The `unknown` / `error` defaults are bare inline-styled divs (zero CSS
dependencies); nicely-styled versions ship in `@ui-fired/catalog`
(`UnknownComponent`, `RenderError`) for hosts to attach manually, exactly like
the catalog's `ConfirmModal`.

Like `functions`, pass a **stable reference** (module const or memoized): it
folds into the registry-value memo deps, so a fresh object each render churns
the context and re-renders the whole tree. The map is extensible — adding a
slot is one field here plus one resolution site (`RecursiveRenderer` for
per-node chrome, `<Renderer>` for tree-level chrome).

### Inner — `RecursiveRenderer` + `createComponentImplementation`

`RecursiveRenderer` walks the element tree. For each element:

1. **Subscribe to auto-detected deps** ([`OVERVIEW.md`](./OVERVIEW.md) §8). For
   each dep, `parseScope(dep)` → `[scope, path]`, then
   `scopes[scope].$emitter.on(path, forceRender)`, where `forceRender` bumps a
   `useReducer` counter. This `$emitter` subscription is the seam (§7).
2. **Build children**: map `element.children` to `<RecursiveRenderer>` (or
   `<ListRenderer>` for list children). A falsy `element.children?.length`
   yields `null` children — the array-aware guard prevents a rehydrated empty
   `children: []` from clobbering `element.props.children` text downstream.
3. **Run defaults** (one-shot, gated by `hasBeenRenderedRef`). If any default
   resolves to a Promise, the element suspends — see §5.
4. **Render** `<Component element={element} scopes={scopes}>{children}</Component>`,
   where `Component` is the registered renderer entry.

Inside the component, `createComponentImplementation`:

1. **Evaluate `element.props`** (core `evaluate`) against the current scopes →
   props object.
2. **Evaluate `element.hidden`** → boolean (absence = `false`).
3. **Build bound `callbacks`** — each handler closes over `element.callbacks[key]`
   and walks the steps when fired, with `evt` bound to the event payload. A step
   carrying `confirm` asks the confirm host first — the `components.confirm`
   modal (e.g. catalog's `ConfirmModal`), else the `window.confirm` default; on
   cancel, that step and all later steps are skipped.
4. **Build children prop**: a non-empty *array* from RecursiveRenderer wins;
   otherwise any `children` from `props` (text content) takes effect.
5. **Render** `renderer({ ...props, ...callbacks, children?, generatedKey: element.key })`.
6. If `element.hidden` was specified, wrap in `<Activity>` (§4).

---

## 3. Component implementation — `impl.tsx`

A renderable component is a **pair**: a `def.ts` (the partner module the LLM
reads) and an `impl.tsx` (the React component). The def half —
`createComponentDefinition` — is **agnostic and lives in core**
([`OVERVIEW.md`](./OVERVIEW.md) §12). The implementation half is React and pairs with
the def via `createComponentImplementation` from this package:

```tsx
import { createComponentImplementation } from "@ui-fired/react";
import { Input as ShadcnInput } from "./shadcn-input";
import { InputDef } from "./def"; // createComponentDefinition(...) — from @ui-fired/core

export const InputImpl = createComponentImplementation({
  def: InputDef,
  render: ({ value, type = "text", placeholder, disabled, onChange, generatedKey }) => (
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

The renderer's signature is **typed against the def**: props are inferred from
`propDefs`, callbacks become `(args) => Promise<void>` from `callbackDefs`, plus
an implicit `children?: ReactNode` and `generatedKey: string`. Registration
(the `componentDefinitions` map + the `componentImplementations` array) is covered in
[`OVERVIEW.md`](./OVERVIEW.md) §12 / §17 — the def map drives the prompt, the
renderer array drives this binding.

### The `data-key` convention

Spread `generatedKey` onto the implementation's **root DOM node** as
`data-key={generatedKey}` — the `Input` example above does. `generatedKey` is
the element's own `key` (§2, step 5).

This is **not required by the engine**: it never reads `data-key`, and an implementation
that omits it still renders correctly. But **every catalog implementation follows it**,
and new implementations should too — a stable `key → DOM node` mapping is what lets host
tooling reach back from a rendered node to its source element. It powers element
**selection**, **hover-highlight** (the reference website cross-links its
JSONLines panel to the rendered output purely through `[data-key]` — hover a line,
the element outlines, and vice-versa), inspector / devtools overlays, and
test / automation targeting. Put it on the **outermost** element the renderer
returns so the whole subtree resolves to a single key, and let it pass straight
through to a real DOM element (host elements take `data-*` as-is; shadcn / Radix
primitives forward it via `{...props}`).

---

## 4. Hidden — `<Activity>` mechanics

> The `hidden` line property is defined in [`LINES.md`](./LINES.md); its
> reactivity is [`OVERVIEW.md`](./OVERVIEW.md) §8. This is the React mechanism.

`element.hidden` is a bare expression evaluated every render. If truthy, the
element wraps in React 19's `<Activity mode="hidden">`, which:

- Keeps the subtree **mounted** with state intact.
- Pauses effects and rendering until it goes visible again.
- Toggles visibility without losing input focus, scroll position, expanded
  toggles, etc.

So `hidden` is *not* unmount/remount — it's a display-toggle with state
preservation. Useful for tabs, accordions, conditional panels. Because
auto-deps treats `hidden` as a reactive site, writing the path it reads wakes
the element and flips visibility.

---

## 5. Suspense — async `defaults` and `init`

`defaults` / `init` execution semantics (run-once, evaluated-before-written,
host-vs-LLM seeding) are in [`OVERVIEW.md`](./OVERVIEW.md) §9. The **async**
case is React-specific: if a default expression (or the `init` callback)
returns a Promise, the element wraps itself in `<Suspense>` with `use(promise)`
and renders the registered placeholder (the renderer's own, else the
host-supplied `components.placeholder`) until every promise resolves. Children mount
only after resolution. This is the binding's single suspension path; both
string-form async defaults and an async `init` flow through it.

---

## 6. React-specific performance

The engine-level perf notes (SafeEval parse cache, `extractDeps` WeakMap, proxy
cache) are in [`OVERVIEW.md`](./OVERVIEW.md) §16. React-binding specifics:

- **Re-render granularity** — a `forceRender` on the element's `useReducer`
  re-renders *that element only*; React then diffs the underlying component
  normally. There is no virtual-DOM diffing of derived state — the proxy emits
  exactly one event per write, and only elements subscribed to that path
  re-render.
- **Item proxies as durable state** — `ListRenderer` keys per-item proxies by
  item id, so per-item React state (input focus, edit mode) survives
  source-array mutations and re-renders. See [`OVERVIEW.md`](./OVERVIEW.md) §10.
- **Context identity** — the registry value is memoized so context consumers
  only re-render when `implementations`, `functions`, or `components` actually changes.

---

## 7. Binding seam — what a non-React binding implements

The engine exposes a small, framework-neutral surface. A Vue/Svelte/vanilla
binding re-implements §2–§6 by calling exactly these, all from
`@ui-fired/core`:

| Engine surface | What the binding does with it |
|---|---|
| `createProxyScope({})` | Create the `root` scope (and one per list item). Pure JS Proxy + emitter — no React. |
| `proxy.$emitter.on(path, cb)` / `$set(path, v)` | Subscribe to path-exact writes / write state. React's binding calls `cb = forceRender`; a Vue binding would trigger a `ref` instead. |
| `extractDeps(element)` | Get the reactive deps to subscribe to per element (WeakMap-cached). |
| `parseScope(dep)` | Split `scopes.X.Y` into `[scopeName, leafPath]` for subscription. |
| `evaluate(valueSource, { scopes, evt? }, { functions })` | Run a `props` / `hidden` / `each` / `defaults` / `callbacks` expression against current state. Returns a value (or a Promise the binding suspends on). |
| `buildElementsById(lines)` | Flatten the JSONL into a key→element map with partial-replacement. |
| `isComponentListEntry(el)` | Branch element vs list during the tree walk. |
| `createComponentDefinition` | Author the agnostic partner def (shared by every binding). |

The React-only pieces a binding **replaces**: the `useReducer`/`forceRender`
subscription, `<Suspense>`/`use()` for async, `<Activity>` for `hidden`, the
context registry, and the component-pair renderer factory
(`createComponentImplementation`). None of those live in core.

---

## Cross-references

- [`OVERVIEW.md`](./OVERVIEW.md) — the framework-agnostic engine runtime.
- [`SPEC.md`](./SPEC.md) — the normative ui-fired format contract.
- [`LINES.md`](./LINES.md) — per-property authoring reference for each line field.
- [`EXPRESSIONS.md`](./EXPRESSIONS.md) — expression syntax + the evaluator's security limits.
- [`SCOPES.md`](./SCOPES.md) — the reactive proxy state library underneath all of this.
- LLM-facing contract for elements: [`../src/prompt/INSTRUCTIONS.md`](../src/prompt/INSTRUCTIONS.md)
