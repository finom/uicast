# Changelog

All notable changes to this package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- **Row scopes are the items.** `scopes.<as>.name` reads the element's field; `scopes.<as>.$index`, `$id` and `$value` are the runtime's. `scopes.<as>.item` / `.index` / `.id` and `childScopes` are gone; per-row UI state lives at root keyed by `$id`. A row write edits the element inside the source array in place and wakes the array's readers, through nested lists and across lists sharing an array. Rows with duplicate `keyBy` values no longer share a scope.
- **Structural props memo.** An element's evaluated props are compared structurally with the last render's, and the implementation is not called again when nothing changed. Callbacks and the children slot are stable across an element's own re-renders for the same reason.
- `set` addresses are `scopes.<scope>.<field>` only; a deeper or numeric address, or one without the `scopes.` prefix, is rejected at mount.

### Fixed

- **A whole-`item` write no longer reverts.** It landed on the row proxy, then the container's next render copied the old array element back over it. A row write now goes into the array.
- **`<RendererProvider evaluator={instance}>`, required.** The provider takes the expression evaluator itself — `new Evaluator({ functions })` from `@uicast/expr`, a `PassthroughEvaluator` from `@uicast/expr-passthrough`, or your own implementation of core's `ExpressionEvaluator` interface — with the host functions bound on it. The `functions` prop, the `evaluator="native"` string and `maxExpressionLength` are gone (`maxSourceLength` is an option of the evaluator). Create the instance once, outside render: it holds the parse cache.
- `standard-tool` is no longer a dependency, and nothing from `@uicast/expr` is imported.

### Fixed

- **A reachable `children` cycle no longer exhausts the heap.** `root → a → b → a` recursed without bound; each render now carries its ancestry and refuses a key that repeats, as a `guardrail-violation` naming it. A list's rows re-enter under the list's own key by design and are not a cycle.
- **A write to a scope that does not exist is classified.** `set: "scopes.nope.x"` surfaced as a raw `TypeError` with reason `unknown`, so the repair loop was never told it was the document's mistake — usually a wrong `as` name. It is `unknown-reference` now.
- A `props`, `hidden`, or `each` expression that evaluated to a Promise was refused, but the promise itself was dropped unsettled — an `Uncaught (in promise)` in the console. Its rejection is now swallowed at the point it is refused.
- Compiled to ES2022.

### Added

- `evaluator` on `RendererProvider` (`"interpret"` | `"native"`) selects the expression back end for documents under the provider. `"interpret"` (default) needs no CSP `unsafe-eval`; `"native"` runs the validated source with `new Function` for trusted-author documents.
- `maxExpressionLength` on `RendererProvider` (default 1000): the longest expression source accepted, rejected before parsing. Pass the same value to `getExpressionsPartialPrompt({ maxLength })` so the model knows the limit.
- `urlPolicy` on `RendererProvider`: which URLs may reach a prop a definition declares as a URL. Defaults to relative, same-origin, and raster `data:` images; widen it with `{ hosts: ["cdn.example.com"] }` or pass a predicate. A rejected URL is a classified document fault in the element's error slot.

### Removed

- The `allowGlobals` prop, which was threaded through the provider but never read by the evaluator. Extra globals are a direct-`Evaluator` concern; the React binding does not widen the set.

### Fixed

- Prototype-reaching `set` paths (`scopes.root.__proto__.x`) are rejected at mount and before any step runs, alongside the existing numeric-key rule.

### Added

- Initial public beta of the React binding: `<RendererProvider>` + `<EntriesRenderer>`, the recursive renderer and registry, per-element error boundaries with classified errors, and the confirm seam.
