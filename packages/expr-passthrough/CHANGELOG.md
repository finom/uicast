# @uicast/expr-passthrough

## 0.0.1-beta.0

Initial release: the `new Function` back end, moved out of `@uicast/expr` (its `mode: "native"`) into its own package, so the default package never contains `new Function`.

- `PassthroughEvaluator` is its own class, implementing `@uicast/expr`'s `ExpressionEvaluator`; the grammar, the static checks, host-function binding and the exit gate are imported from `@uicast/expr/internal`, so both evaluators check the same language. What it drops is the run-time membrane and the budget.
- **Every identifier written in the source is a parameter of the compiled function.** The bound ones get values; the rest are `undefined`. Nothing in an expression can resolve to a global by name, with no list of globals to maintain — the shadow list the old mode carried is gone.
- **Written member names that reach the prototype chain are refused up front** (`constructor`, `__proto__`, `prototype`, `bind`, `call`, `apply`, …). This is the package's own backstop: the interpreter needs no such list, because nothing inherited is readable there.
- A host-function name the engine cannot take as a strict-mode parameter is refused at construction. Passing `budget` throws — nothing here meters the engine.
- Engine errors are classified `runtime` `ExpressionError`s.
