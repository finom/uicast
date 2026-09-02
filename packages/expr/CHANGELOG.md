# @uicast/expr

## [Unreleased]

### Changed

- **Charging moved into the membrane.** One step per method or global call and the result's size, charged after the call; a method charges only its own proportional work and output that can outgrow its input. A function result is refused at the call. One `Budget` per evaluation, none shared.
- **`ExpressionEvaluator`, the interface.** `Evaluator` implements it, so does `PassthroughEvaluator`, and uicast types against it. Implement it to plug in an evaluator of your own.
- **The `new Function` back end is its own package.** `mode: "native"` is gone; `@uicast/expr-passthrough` ships `PassthroughEvaluator` with the same options, minus `budget`. This package now contains no `new Function` at all — a dependency scan of the shipped code finds none. The static half of the language — parser, validator, analysis, host-function binding, the exit gate — is exported from `@uicast/expr/internal` so the passthrough package checks exactly the same grammar; uicast types against its own `ExpressionEvaluator` interface in `@uicast/core`, which both satisfy.
- **No deny-list anywhere in the interpreter.** `FORBIDDEN_KEYS`, `FORBIDDEN_IDENTIFIERS` and `RESERVED_WORDS` are gone. Reads were already own-property only and calls already go through null-prototype tables, so `({}).constructor` is simply `undefined` and `.constructor()` is "not an available method" — no name needs refusing by name. What stays is one grammar rule: `{ __proto__: x }` in an object literal is JS syntax for setting a prototype, a form the language does not have; a computed `__proto__` key is an own property, as in JS. A host-function name is screened by the parser's own verdict (does it parse as a bare identifier?) instead of a word list. The passthrough package keeps a static backstop for written prototype names, because it has no membrane.
- **A host-function call is bound at compile time.** The validator already allows a tool only as a callee, so the interpreter resolves it when it compiles the call; the `HostFn` value kind is gone, and `typeof` never sees a tool.
- **`StandardToolV0` and the Standard Schema interfaces ship in this package**, copied verbatim from `standard-tool` 0.1.0 and `@standard-schema/spec` 1.1.0 (the spec is meant to be copied) — the `standard-tool` dependency is gone. A tool built with that library satisfies the type as-is.
- **Host functions bind at construction, and the evaluator owns the boundary.** `new Evaluator({ functions })` takes `StandardToolV0[]`; there is no per-call `functions` option. Every call now validates its input against the tool's `inputSchema` before `execute` and its output against `outputSchema` after — nothing checked the call before this, so an expression could hand a tool any shape it computed. A synchronous tool with synchronous schemas still allocates no promise; async appears only where a validator or the tool actually returns one.
- **A host function can only be called, with zero or one argument.** Knowing the tool names at analysis time makes this a static rule, which closes three divergences between the back ends at once: `f(1, 2)` used to drop the second argument under `interpret` and pass it under `native`; a bare `f` escaped as the `HostFn` box or the raw function; and `f.name` / `f.length` read through under `native` only. All three now fail validation identically in both modes.
- **A global is callable or constructible only where the tables say so, in both modes.** `Date()`, `Math()`, `new Number(1)` are refused by the validator; before, `interpret` refused them at run time and `native` ran them.
- **An arrow takes at most five parameters and no rest parameter.** Before, a fifth parameter was silently `undefined` under `interpret` and bound under `native`, and `(...args) =>` failed only when called.
- **`eval(source, ...contexts)` and `compile(source) → (...contexts)`**, generic in input and output. Contexts are searched right to left — later wins — and never merged into one object. The third options argument is gone with the per-call `functions`.
- **The class names match what the thing is now.** `SaferEval` is `Evaluator`, `SaferEvalError` is `ExpressionError` (with `EvaluatorOptions` and `ExpressionErrorReason` following). "Safer" compared this to `eval` — the compiled design it replaced. Nothing evals here anymore; the class evaluates a closed expression language, and the error is about the expression.
- **The language is smaller.** `await` is gone — host calls return promises the host awaits; the whole async axis left the interpreter with it. The mutating `.sort()` / `.reverse()` are gone in favor of the standard non-mutating `.toSorted()` / `.toReversed()`, identical in both modes — the one deliberate divergence from plain JavaScript this removes. Also cut, as nothing a display value needs: string `.charAt` / `.charCodeAt` / `.codePointAt` / `.concat` / `.toLocaleLowerCase` / `.toLocaleUpperCase`, array `.concat` / `.keys` / `.entries`, number `.toPrecision`, `String.fromCharCode`, `Array.of`, `Date.parse`, `encodeURI`, `decodeURI`.
- **Written method names are part of the shared grammar.** The validator now checks every non-computed (and string-literal computed) method call against the allow-list — per namespace for `Math.` / `JSON.` / `Object.` / `Array.` / `Number.` / `Date.` — so both back ends refuse the same calls. Before, a cut method was rejected only by the interpreter's tables and `native` ran the real one.
- `ExpressionError` gains `invalid-arguments` and `host-function` reasons, an optional `cause` carrying the original throw, and a cross-copy-safe `ExpressionError.is()` — this package is a peer dependency, so `instanceof` can silently fail across duplicate copies.
- `validate()` returns `{ freeIds, toolCalls }` — `isAsync` is gone from `ExpressionFacts` and from the class, with the language's async support.
- `scopeReads(source)` is now `memberReads(source, root)`, and `ExpressionFacts` no longer carries `scopeReads`. Which root a host tracks (`scopes` in uicast) is framework vocabulary, not language — the analysis is generic here and the binding lives with the host. Paths are computed on first ask and cached per root.
- **Compiled to ES2022.** Private fields emit natively instead of through TypeScript's helper functions, which were ~15% of evaluation time; `?.` and `??` no longer transpile to ternaries. Every evergreen browser and Node 18+ runs it.

### Added

- **A source-length limit.** One expression may be at most `maxSourceLength` characters (default 1000 — the shipped corpus tops out around 140), rejected before acorn runs, so oversized input costs nothing. The prompt renders the limit from the same constant.
- `@uicast/expr/internal`: `DEFAULT_MAX_SOURCE_LENGTH`, `hostFunctionNameFault`, `ALLOWED_METHOD_NAMES` and `NAMESPACE_METHOD_NAMES`, so a host's prompt can be checked against the language it describes and its host-function names against the screen the evaluator runs; `childNodes`, the one AST walk, for the passthrough package.
- `corpus.test.ts`: the interpreter against plain JavaScript on every expression the language allows — the differential suite lives with the interpreter, not only with the other back end.
- The README lists the whole language — syntax, globals, every method — and a test keeps that list equal to the tables.

### Fixed

- **Nothing but plain data leaves an expression, in either mode.** The per-read gate refused a function on a direct read, but every bulk copy walked past it: `Object.values(o)`, spread, `slice`, `filter`, a plain `scopes.arr` read — each returned a live function, callable by the host, and `send(Object.values(o))` delivered one straight into host code. `Object.values(x => x * 2)` even leaked the interpreter's own closure. An exit gate now walks what an expression returns and what it hands to a host function; a function or a class instance anywhere inside is refused, and `Object.keys` / `values` / `entries`, object spread and `...rest` in a pattern refuse a non-plain receiver the way a direct read already did. `native` inherits the exit gate too — it can still read through the prototype chain, but a function can no longer come back out.
- **The exit gate stops at 256 levels** and classifies what it meets: a 10,000-level nesting escaped as a raw `RangeError`, a Proxy over a `Map` as a raw `TypeError`.
- **Every lookup table is null-prototype**, the nested ones included, so `Object.prototype` never looks like entries: `Math.toString` returned the real `Object.prototype.toString`, `[1].toString()` rendered `"[object Undefined]"`, `toString.trim()` threw a raw `TypeError` out of `validate()`, and `new Date(0)["to" + "String"]()` answered `"[object Undefined]"`.
- **Work the step counter could not see is charged now.** `Object.fromEntries` iterated a string per character with nothing charged (it takes an array or a `Map`, and charges per pair); `lastIndexOf` (V8's is O(n·m)); `replaceAll` and `replace`, whose output is `matches × replacement` and whose `` $` ``, `$&` and `$'` each expand to the whole receiver — a 100k-character string became 10 million with nothing charged; `.flat()` and `split()`, which built the whole result before checking it; `normalize()` and `toUpperCase()`, whose output can be larger than the input; `new Map` / `new Set` from a large source. `.flat()` also caps its depth at 32. A NaN size, as from `padStart("x")`, no longer disables the total allocation cap for the rest of the evaluation.
- **Runtime faults are classified in both modes.** A built-in's own `RangeError` or `TypeError` — `(1).toFixed(101)`, a bad `Intl` locale, `new Map([1])` — was a raw throw; under `native` so was every engine error, `null.x` included; `encodeURIComponent` on a lone surrogate threw a raw `URIError` in both. All are `ExpressionError` with reason `runtime` now.
- **Plain JS where the construct is allowed.** `Number()` is `0`, not `NaN`; `Object.keys(null)` throws like JS instead of answering `[]`; `JSON.stringify` omits a function and renders `Math` as `{}`, and honours an array replacer; `typeof Date` and `typeof (x => x)` answer `"function"`; `[a, ...rest]` over a string yields an array; `"a".replace("a")` inserts `"undefined"`; `Array.from({ length: -1 })` is `[]`; `[9, 8]["0" + "1"]` no longer reads index 1 (`interpret` refuses a non-index string key on an array, `native` returns `undefined`); the positional arguments JS takes — `endsWith`, `includes`, `indexOf`, `lastIndexOf` on strings and arrays, `localeCompare(locales, options)`, `toLocaleString(locale, options)` — are honoured instead of dropped; `(1).valueOf()` and a `Date`'s `toString()` exist; arrays and strings implement `toString`, `valueOf` and `toLocaleString`.
- A computed key in a destructuring pattern — `({ [k]: v }) => v` — read `undefined` under `interpret`. It is evaluated now, as under `native`.
- A tool returning a function or a class instance was blamed on the document (`guardrail-violation`). It is the host's return value, so it is reported as `host-function`.
- A schema whose `validate` throws, or returns a thenable that is not a `Promise`, is refused as the host's misbehaving schema rather than read as a verdict — the thenable case used to feed `undefined` to `execute` silently.

### Removed

- **BigInt literals.** `7n ** 300000000n` ran for eight seconds and a gigabyte with nothing to charge, and `1n + 1` threw a raw `TypeError`. The language never advertised them.
- **The `globals` option**, and with it `allowGlobals` on the prompt builder. Nothing in the repo passed either, the React binding never exposed them, and with `globals` gone `allowGlobals` could only advertise names the evaluator would refuse.
- **The `./prompt` entry point.** `getExpressionsPartialPrompt` and the language markdown now live in `@uicast/core/prompt`, so prompt assembly is one import.
- `globalNames()` — it returned exactly what `ALLOWED_GLOBALS` already is. `Evaluator.clearCache()` — the cache self-bounds at `maxCacheSize`, and a host wanting a clean slate can construct a new evaluator. `ALLOWED_NODES`, `Lambda`, and `Namespace` are no longer exported: grammar tables and membrane classes the evaluator builds itself.
- The `sandbox` and `safe-eval` npm keywords — it is neither, and the README says why.

## 0.0.1-beta.0

Initial release. Extracted from `@uicast/core`'s expression evaluator and
rebuilt as a boundary rather than a guardrail.

- **No `new Function`.** Expressions are parsed once with acorn and compiled to a
  tree of closures. Nothing hands source to the JavaScript engine, so uicast runs
  under a strict Content-Security-Policy with no `unsafe-eval`.
- **Closed AST allow-list.** The grammar is a fixed set of node types. There are
  no statements, so no loops and no `try`/`catch`; no declarations and no
  `function` keyword, so nothing can be named; no assignment, so an expression is
  pure structurally rather than by convention. The operator set is trimmed to
  what a display value needs — no `in`, no bitwise operators — and an optional
  *call* (`x?.()`) is rejected in favour of an optional *receiver* (`x?.y()`).
- **Runtime membrane.** Every property read and every call resolves through one
  chokepoint that sees the resolved key, closing the computed-key escape class
  (`obj["con"+"structor"]`). Plain objects are read by own property only, and
  only plain data is readable — a class instance, DOM node, or function is
  refused at the boundary.
- **CPU and allocation budget.** Step counter, wall-clock deadline, string and
  array caps, and an AST depth limit.
- No regular expressions: ReDoS runs inside the regex engine where no counter
  can reach it.

### Prompt

`getExpressionsPartialPrompt({ allowGlobals?, note? })` (exported from
`@uicast/expr/prompt`) returns the
`# JavaScript Expressions` block: the syntax, the method allow-list, and the
globals. It lives here because it is a description of `grammar.ts`,
`membrane.ts`, and `globals.ts`, and the globals slot is filled from
`ALLOWED_GLOBALS` itself, so that half cannot drift from what the evaluator
accepts. `note` appends host-specific context as a trailing `## Note`. Hosts
embedding the evaluator describe their own context variables separately.

### Back ends

Two, selected with `mode` — different threat models, not two strengths of one
guarantee.

- `interpret` (default) compiles the AST to a closure tree this package runs
  itself, checking every read and call as it happens. Nothing is trusted. No
  `new Function`, so no CSP `unsafe-eval`.
- `native` validates against the same grammar and then runs the expression with
  `new Function`. For documents the host generated itself, where the model is
  the first line of defence and `unsafe-eval` is acceptable. Within a few
  percent of raw `new Function` once a callback is involved.

`native` still enforces everything the shared validator can decide without
running anything: no statements, declarations, assignment, regular expressions,
tagged templates, `eval`, or immediately-invoked functions; no prototype-reaching
property name that is *written down*, including `obj["constructor"]`; and no free
identifier the host did not hand in. Its residual is the case a static pass
cannot decide — a property name assembled at run time, `obj["con"+"structor"]` —
plus uncapped allocation and the real prototype methods.

A parity suite runs one shared corpus through both back ends and plain
JavaScript and requires all three to agree, requires both to refuse everything
the grammar forbids, and asserts the residual explicitly in both directions so
the difference between the modes stays visible in CI.

### Layout

`src/` holds the shared language machinery — parse, validate, grammar, membrane,
budget, globals, analyze. The back ends sit beside it: `src/interpret/` compiles
the AST to a closure tree (the default, and the reason there is no `unsafe-eval`
requirement), and `src/native/` validates and then runs the source with `new Function`.
`index.ts` wires whichever one is selected, so the two differ in mechanism and
never in policy.

### Performance

Everything that can be settled while compiling is, so evaluation is closures
calling closures:

- Identifiers resolve to a `(depth, slot)` frame address at compile time — the
  run-time frame is a values array, never searched by name.
- A plain member chain `a.b.c` fuses into one closure walking a key array.
- Operator implementations are resolved once; a subtree that cannot produce a
  Promise gets a direct closure, not one that checks.
- Callback arguments are positional into a slots array — no per-element argument
  array, no per-call `Map`.
- The budget is charged statically: one tick per callback invocation, costed by
  the arrow's node count, instead of one per node.
- Sync evaluations reuse one `Budget`, host-function wrappers and native
  parameter shapes are cached, so the steady-state per-eval allocation is close
  to zero.

Measured, interpret / native / bare `new Function`:
`scopes.root.count > 0` ~72 / ~60 / ~20 ns; a 1000-row `.filter()`
~25 µs / ~1.44 µs / ~1.36 µs; a 1000-row `.reduce()` ~80 µs / ~1.04 µs / ~0.96 µs.
