# @uicast/expr-passthrough

## [Unreleased]

### Fixed

- **Two written spellings of a prototype name got past the static backstop.** A substitution-free template-literal key (`` x[`constructor`] ``) and a destructuring key (`({ constructor: c }) => c`) reached the real prototype chain and could run code through `Function`. Both are refused up front now; the run-time-assembled name stays the documented residual. An object literal's key still defines an own property, as in JS.

### Changed

- The static half — parse, validate, cache — is `@uicast/expr/internal`'s `Analyzer`, no longer a copy of the interpreter's.
- **Binding moved into the compiled function.** The engine-compiled function looks its names up in the contexts itself, in one fixed-arity call, instead of the evaluator building an argument array and spreading it per evaluation. Short expressions run about twice as fast; `filter`/`map`/`reduce` over data now match bare `new Function`.

## 0.0.1-beta.0

Initial release: the `new Function` back end, moved out of `@uicast/expr` (its `mode: "native"`) into its own package, so the default package never contains `new Function`.

- `PassthroughEvaluator` is its own class, implementing `@uicast/expr`'s `ExpressionEvaluator`; the grammar, the static checks, host-function binding and the exit gate are imported from `@uicast/expr/internal`, so both evaluators check the same language. What it drops is the run-time membrane and the budget.
- **Every identifier written in the source is a parameter of the compiled function.** The bound ones get values; the rest are `undefined`. Nothing in an expression can resolve to a global by name, with no list of globals to maintain — the shadow list the old mode carried is gone.
- **Written member names that reach the prototype chain are refused up front** (`constructor`, `__proto__`, `prototype`, `bind`, `call`, `apply`, …). This is the package's own backstop: the interpreter needs no such list, because nothing inherited is readable there.
- A host-function name the engine cannot take as a strict-mode parameter is refused at construction. Passing `budget` throws — nothing here meters the engine.
- Engine errors are classified `runtime` `ExpressionError`s.
