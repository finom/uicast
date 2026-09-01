# @uicast/expr

## [Unreleased]

### Removed

- **A tighter main entry.** `globalNames()` is gone — it returned exactly what `ALLOWED_GLOBALS` already is. `Evaluator.clearCache()` is gone: the cache self-bounds at `maxCacheSize`, and a host that wants a clean slate can construct a new evaluator. `ALLOWED_NODES`, `FORBIDDEN_KEYS`, `HostFn`, `Lambda`, and `Namespace` are no longer exported — grammar tables and membrane classes the evaluator builds itself, with nothing a consumer can do with them.

### Changed

- `compile()` takes `functions` like `eval()` does: the returned closure is `(context?, functions?)`. Before, a compiled expression could not call host functions at all.

### Added

- `@uicast/expr/internal`: `RESERVED_WORDS` and `isUsableName(name)` — the screen for names a host binds into the language (`functions` or context keys). It lives here so hosts and uicast's core share one rule; a test keeps it in agreement with the parser (the screen may be stricter, never looser).

### Added

- **A source-length limit.** One expression may be at most `maxSourceLength` characters (default 1000 — the shipped corpus tops out around 140), rejected before acorn runs, so oversized input costs nothing. `getExpressionsPartialPrompt({ maxLength })` renders the limit into the prompt from the same constant, and the budget rule now tells the model to write the shortest expression that does the job.

### Changed

- **The class names match what the thing is now.** `SaferEval` is `Evaluator`, `SaferEvalError` is `ExpressionError` (with `EvaluatorOptions` and `ExpressionErrorReason` following). "Safer" compared this to `eval` — the compiled design it replaced. Nothing evals here anymore; the class evaluates a closed expression language, and the error is about the expression.
- **The language is smaller.** `await` is gone — host calls return promises the host awaits; the whole async axis left the interpreter with it. The mutating `.sort()` / `.reverse()` are gone in favor of the standard non-mutating `.toSorted()` / `.toReversed()`, identical in both modes — the one deliberate divergence from plain JavaScript this removes. Also cut, as nothing a display value needs: string `.charAt` / `.charCodeAt` / `.codePointAt` / `.concat` / `.toLocaleLowerCase` / `.toLocaleUpperCase`, array `.concat` / `.keys` / `.entries`, number `.toPrecision`, `String.fromCharCode`, `Array.of`, `Date.parse`, `encodeURI`, `decodeURI`.
- **Written method names are part of the shared grammar.** The validator now checks every non-computed (and string-literal computed) method call against the allow-list — per namespace for `Math.` / `JSON.` / `Object.` / `Array.` / `Number.` / `Date.` — so both back ends refuse the same calls. Before, a cut method was rejected only by the interpreter's tables and `native` ran the real one.
- `validate()` returns `{ freeIds }` — `isAsync` is gone from `ExpressionFacts` and from the class, with the language's async support.
- `scopeReads(source)` is now `memberReads(source, root)`, and `ExpressionFacts` no longer carries `scopeReads`. Which root a host tracks (`scopes` in uicast) is framework vocabulary, not language — the analysis is generic here and the binding lives with the host. Paths are computed on first ask and cached per root.

## 0.0.1-beta.0

Initial release.

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
Extracted from `@uicast/core`'s expression evaluator and rebuilt as a boundary
rather than a guardrail.

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
