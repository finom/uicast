# Changelog

All notable changes to this package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- A JSDoc comment with an example on every public export, shown on hover.
- `<DocumentSkeleton entries>` draws a document's shape from the entries alone, with the implementations and `fallbackComponents` of the nearest `<RendererProvider>`. An element with a `skeleton` draws it with its children inside, one without draws its children, and a leaf without draws `fallbackComponents.defaultSkeleton`; a list draws three items, and an element with `hidden` is left out, since its value is not known yet. It evaluates nothing, so it renders in a server pass, and it draws no markup of its own beyond an `aria-busy` wrapper.
- `SkeletonComponentProps.children`. A skeleton that receives `children`, even `null`, draws the element itself and renders its own tag. Called without them, it fills the slot of a child that has not streamed in yet, inside the real parent.
- `SkeletonComponentProps.entry`: the element's own entry, or the parent's when the skeleton fills a child's slot. Nothing in it is evaluated.
- `SkeletonComponentProps.knownProps`: the element's props that need no evaluation, a literal or none, parsed by its definition with the defaults filled in and checked against `urlPolicy`, as `render`'s are. Absent when they come from an expression or fail those checks, and in a child's slot. An implementation's `skeleton` gets it typed from its definition.

### Changed

- The `scopes` that `render` and `init` get type `root` as always present, so `scopes.root` needs no check under `noUncheckedIndexedAccess`.
- **Breaking: `ErrorComponentProps` has no `elementKey`.** Read `error.elementKey`: the element's error boundary sets it when the code that threw did not.
- **Each list item has two scopes.** `scopes.<as>` is the item and nothing else: `scopes.<as>.name` reads the element's field. `scopes.$<as>` is the row: the runtime's read-only `index`, `id` and `value` (a primitive item), and the row's own state. Row state starts empty, stays out of the data, and a write to it re-renders only that row. It is kept by id, so it survives a reorder, a refetch and a filter that hides the row and shows it again, nested lists included; it lasts as long as the list. `scopes.<as>.item` / `.index` / `.id` and `childScopes` are gone; state read outside the row lives at root keyed by the row's `id`. A write to an item field never changes the item: it puts an edited copy into the array `each` reads, and in a nested list into every array above it. The host's objects stay untouched, frozen data can be edited, and a component given the array or the whole item sees the edit. Only the edited row and the readers whose result changed re-render. Rows with duplicate `keyBy` values no longer share a scope.
- **Structural props memo.** An element's evaluated props are compared structurally with the last render's, and the implementation's `render` runs as a memoized component of its own, so it is not called again when nothing it receives changed. Callbacks and the children slot are stable across an element's own re-renders for the same reason. A throw from `render` reaches the element's boundary and is classified `implementation` there.
- **`render(props, context)`.** An implementation's `render` takes a second argument, `{ entry, loading, scopes }`: the document line, the entry's evaluated `loading`, and the scopes it reads. `generatedKey` is gone from the props; use `context.entry.key`.
- **Debounced callback steps.** A step with `debounce: true` and the steps after it run after 300 ms of quiet, once, with the latest `evt`; a newer call of the same callback replaces the pending run, and unmounting the element cancels it. Steps before it run at once.
- **One React component fewer per element.** The renderer evaluates an element's props and `hidden` and builds its callbacks itself, then renders the implementation's memoized `render` directly; the implementation no longer wraps it in a component of its own. About 10% fewer fibers on a large page.
- `set` addresses are `scopes.<scope>.<field>` only; a deeper or numeric address, or one without the `scopes.` prefix, is rejected at mount.
- **Breaking: `placeholder` is `skeleton`.** An implementation's is `createComponentImplementation({ def, render, skeleton })`; the provider's, drawn where an implementation has none, is `fallbackComponents.defaultSkeleton`; their props type is `SkeletonComponentProps`. The name no longer collides with the `placeholder` prop of an input.
- **While an async seed loads, an element draws the skeleton of its subtree**, as `DocumentSkeleton` draws that part: its `skeleton` with its children's inside, and three items for a list. Before, it rendered itself with its own skeleton in the children slot, and a container drew an empty box. Nothing is evaluated for the skeleton, so a prop that reads the loading data no longer fails before the data arrives. The element follows its own `hidden`; below it, an element with `hidden` is left out. An entry that streams in while it waits joins the skeleton.
- **Breaking:** `ComponentImplementation` is `{ def, skeleton }`; `render` is gone from it. What the renderer runs an implementation with stays inside `@uicast/react`. `<RendererProvider>` throws for an implementation that `createComponentImplementation` did not make, including one made by a second copy of `@uicast/react`.

### Removed

- **Breaking: the types `RenderContext`, `EntriesRendererProps`, `RendererProviderProps`, `InitContext` and `Scopes`.** TypeScript infers each where it is used: `render`'s second argument, the props of `<EntriesRenderer>` and `<RendererProvider>`, and the argument of an `InitFn`.

### Fixed

- **A list whose `as` names an existing scope fails as `invalid-list`.** `root`, a host scope, or the `as` of an enclosing list: the rows hid it, so the outer item or the root state could not be read, and nothing reported it. Lists side by side do not stack and may still share a name.
- **A render React throws away no longer runs its seed twice.** React can drop a render before it mounts, for example when a sibling in the same Suspense boundary suspends. The next render started the seed again, so its host functions ran again, and the first seed woke the dropped render when it settled (React: "Can't perform a React state update on a component that hasn't mounted yet"). A render of the same entry under the same `<RendererProvider>` now takes over the seed already started, a remount included, and a settled seed wakes only a mounted element. A failed seed still runs again on a fresh mount. A test that mounts an element whose seed suspends must `await act(...)`, as React asks; the old wake finished a sync mount by accident.
- **A seed that fails in a server pass is reported.** The server renders an element once, so the failure was never rethrown: the HTML left the seeded field unset and no `onError` ran. The element now sends its skeleton, `onError` receives the error, and the browser renders the element again.
- **`render` may use hooks again.** It was called inside `useMemo`, which skipped its hooks on a memo hit — React refused with "Do not call Hooks inside useMemo" and a fence or page whose implementation used `useState` could render nothing. Nineteen catalog implementations do.
- **A list re-emitted with a new `as` name gives its rows the new scope.** The cached row scopes kept the old name, so a child reading `scopes.<newName>.x` failed with `Cannot read "x" of undefined`.
- **A seed streamed in after its readers no longer sets state mid-render.** Its sync writes woke already-mounted subscribers during the seeding element's render (React: "Cannot update a component while rendering a different component"). While a seed or `init` runs, a wake is deferred to a microtask.
- **A whole-scope read re-renders.** `Object.keys(scopes.root)` or a bare `scopes.row` subscribed to nothing; it now subscribes to every field of the scope.
- **A whole-`item` write no longer reverts.** It landed on the row proxy, then the container's next render copied the old array element back over it. A row write now goes into the array.
- **`<RendererProvider evaluator={instance}>`, required.** The provider takes the expression evaluator itself — `new Evaluator({ functions })` from `@uicast/expr`, a subclass of it, or your own implementation of core's `ExpressionEvaluator` interface — with the host functions bound on it. The `functions` prop, the `evaluator="native"` string and `maxExpressionLength` are gone (`maxSourceLength` is an option of the evaluator). Create the instance once, outside render: it holds the parse cache.
- `standard-tool` and `@standard-schema/spec` are no longer dependencies, and nothing from `@uicast/expr` is imported.
- **A malformed line fails in its own slot, as `invalid-entry`.** A `seed` that is not an array of steps failed as `(element.seed ?? []).map is not a function`, classified `implementation` (fault `environment`); a callback that is not an array of steps failed on click as `unknown`. Both are the document's mistakes, and the repair loop never saw them. The renderer checks the line at mount, reads none of its fields when one is wrong, and names that field.
- **`keyBy` values `1` and `"1"` no longer share a row key.** Ids were deduplicated by identity, but React keys and id-keyed maps compare them as strings, so the two rows collided (React's duplicate-key warning) and so did their per-row state. The second row's `id` is `1#2` now. A `keyBy` value that is not a string or a number keys its row by index.
- **A name from the document no longer resolves through `Object.prototype`.** `component: "constructor"` crashed the parent as `implementation`; a read of `scopes.constructor?.x` latched the parent's boundary; `set: "scopes.toString.x"` failed as `implementation` instead of `unknown-reference`; a child keyed `constructor` showed "Unknown component: undefined" before it streamed in; `keyBy: "constructor"` made every row's `id` a function. Components, scopes and element keys are own-key lookups now, and `keyBy` reads only the item's own field, else the index.
- `<EntriesRenderer>` finds the roots as `<DocumentSkeleton>` does: a `children` that is not an array names no children. A string `children` counted each of its characters as a child key, so an element keyed `a` could stop being a root.
- `<DocumentSkeleton>` outside a `<RendererProvider>` threw "useRendererRegistry must be used within a RendererRegistryProvider". Both renderers now throw the same error, which names the provider.

### Fixed

- **A reachable `children` cycle no longer exhausts the heap.** `root → a → b → a` recursed without bound; each render now carries its ancestry and refuses a key that repeats, as a `guardrail-violation` naming it. A list's rows re-enter under the list's own key by design and are not a cycle.
- **A write to a scope that does not exist is classified.** `set: "scopes.nope.x"` surfaced as a raw `TypeError` with reason `unknown`, so the repair loop was never told it was the document's mistake — usually a wrong `as` name. It is `unknown-reference` now.
- A `props`, `hidden`, or `each` expression that evaluated to a Promise was refused, but the promise itself was dropped unsettled — an `Uncaught (in promise)` in the console. Its rejection is now swallowed at the point it is refused.
- Compiled to ES2022.

### Added

- **`loading`.** An entry's `loading` expression evaluates like `hidden`, subscribes the element to what it reads, and reaches `render` as `context.loading`.
- `evaluator` on `RendererProvider` (`"interpret"` | `"native"`) selects the expression back end for documents under the provider. `"interpret"` (default) needs no CSP `unsafe-eval`; `"native"` runs the validated source with `new Function` for trusted-author documents.
- `maxExpressionLength` on `RendererProvider` (default 1000): the longest expression source accepted, rejected before parsing. Pass the same value to `getExpressionsPartialPrompt({ maxLength })` so the model knows the limit.
- `urlPolicy` on `RendererProvider`: which URLs may reach a prop a definition declares as a URL. Defaults to relative, same-origin, and raster `data:` images; widen it with `{ hosts: ["cdn.example.com"] }` or pass a predicate. A rejected URL is a classified document fault in the element's error slot.

### Removed

- The `allowGlobals` prop, which was threaded through the provider but never read by the evaluator. Extra globals are a direct-`Evaluator` concern; the React binding does not widen the set.

### Fixed

- Prototype-reaching `set` paths (`scopes.root.__proto__.x`) are rejected at mount and before any step runs, alongside the existing numeric-key rule.

### Added

- Initial public beta of the React binding: `<RendererProvider>` + `<EntriesRenderer>`, the recursive renderer and registry, per-element error boundaries with classified errors, and the confirm seam.
