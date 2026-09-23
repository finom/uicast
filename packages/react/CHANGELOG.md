# Changelog

All notable changes to this package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `PlaceholderComponentProps.children`. The renderer never passes it, so a placeholder that receives children knows it is drawing the element itself and renders its own tag; without them it is filling a slot inside a real element. A skeleton pass over the entries uses this to draw a document before anything is evaluated.

### Changed

- **Row scopes are the items.** `scopes.<as>.name` reads the element's field; `scopes.<as>.$index`, `$id` and `$value` are the runtime's. `scopes.<as>.item` / `.index` / `.id` and `childScopes` are gone; per-row UI state lives at root keyed by `$id`. A row write edits the element inside the source array in place and wakes the array's readers, through nested lists and across lists sharing an array. Rows with duplicate `keyBy` values no longer share a scope.
- **Structural props memo.** An element's evaluated props are compared structurally with the last render's, and the implementation's `render` runs as a memoized component of its own, so it is not called again when nothing it receives changed. Callbacks and the children slot are stable across an element's own re-renders for the same reason. A throw from `render` reaches the element's boundary and is classified `implementation` there.
- **`render(props, context)`.** An implementation's `render` takes a second argument, `{ entry, loading, scopes }`: the document line, the entry's evaluated `loading`, and the scopes it reads. `generatedKey` is gone from the props; use `context.entry.key`.
- **Debounced callback steps.** A step with `debounce: true` and the steps after it run after 300 ms of quiet, once, with the latest `evt`; a newer call of the same callback replaces the pending run, and unmounting the element cancels it. Steps before it run at once.
- **One React component fewer per element.** The renderer evaluates an element's props and `hidden` and builds its callbacks itself, then renders the implementation's memoized `render` directly; the implementation no longer wraps it in a component of its own. About 10% fewer fibers on a large page.
- `set` addresses are `scopes.<scope>.<field>` only; a deeper or numeric address, or one without the `scopes.` prefix, is rejected at mount.
- **Breaking:** `ComponentImplementation` is `{ def, placeholder }`; `render` is gone from it. What the renderer runs an implementation with stays inside `@uicast/react`. `<RendererProvider>` throws for an implementation that `createComponentImplementation` did not make, including one made by a second copy of `@uicast/react`.

### Fixed

- **`render` may use hooks again.** It was called inside `useMemo`, which skipped its hooks on a memo hit — React refused with "Do not call Hooks inside useMemo" and a fence or page whose implementation used `useState` could render nothing. Nineteen catalog implementations do.
- **A list re-emitted with a new `as` name gives its rows the new scope.** The cached row scopes kept the old name, so a child reading `scopes.<newName>.x` failed with `Cannot read "x" of undefined`.
- **A seed streamed in after its readers no longer sets state mid-render.** Its sync writes woke already-mounted subscribers during the seeding element's render (React: "Cannot update a component while rendering a different component"). While a seed or `init` runs, a wake is deferred to a microtask.
- **A whole-scope read re-renders.** `Object.keys(scopes.root)` or a bare `scopes.row` subscribed to nothing; it now subscribes to every field of the scope.
- **A whole-`item` write no longer reverts.** It landed on the row proxy, then the container's next render copied the old array element back over it. A row write now goes into the array.
- **`<RendererProvider evaluator={instance}>`, required.** The provider takes the expression evaluator itself — `new Evaluator({ functions })` from `@uicast/expr`, a subclass of it, or your own implementation of core's `ExpressionEvaluator` interface — with the host functions bound on it. The `functions` prop, the `evaluator="native"` string and `maxExpressionLength` are gone (`maxSourceLength` is an option of the evaluator). Create the instance once, outside render: it holds the parse cache.
- `standard-tool` is no longer a dependency, and nothing from `@uicast/expr` is imported.
- **A malformed line fails in its own slot, as `invalid-entry`.** A `seed` that is not an array of steps failed as `(element.seed ?? []).map is not a function`, classified `implementation` (fault `environment`); a callback that is not an array of steps failed on click as `unknown`. Both are the document's mistakes, and the repair loop never saw them. The renderer checks the line at mount, reads none of its fields when one is wrong, and names that field.
- **`keyBy` values `1` and `"1"` no longer share a row key.** Ids were deduplicated by identity, but React keys and `$id`-keyed maps compare them as strings, so the two rows collided (React's duplicate-key warning) and so did their per-row state. The second row's `$id` is `1#2` now. A `keyBy` value that is not a string or a number keys its row by index.
- **A name from the document no longer resolves through `Object.prototype`.** `component: "constructor"` crashed the parent as `implementation`; a read of `scopes.constructor?.x` latched the parent's boundary; `set: "scopes.toString.x"` failed as `implementation` instead of `unknown-reference`; a child keyed `constructor` showed "Unknown component: undefined" before it streamed in; `keyBy: "constructor"` made every row's `$id` a function. Components, scopes and element keys are own-key lookups now, and `keyBy` reads only the item's own field, else the index.

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
