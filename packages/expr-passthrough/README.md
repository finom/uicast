# @uicast/expr-passthrough

The [`@uicast/expr`](https://www.npmjs.com/package/@uicast/expr) language, checked statically and then run by the JavaScript engine through `new Function`.

Same grammar, same static checks, same host-function binding, same exit gate. What is missing is everything that runs *during* evaluation: no membrane on reads and calls, no step, time or allocation budget. The page needs `unsafe-eval`. Use it when the author of the expressions is someone you trust — your own generation pipeline, your own tests — and speed matters.

```sh
npm install @uicast/expr @uicast/expr-passthrough
```

```ts
import { PassthroughEvaluator } from "@uicast/expr-passthrough";

const ev = new PassthroughEvaluator({ functions: tools });
ev.eval("rows.filter(r => r.stock > 0).length", { rows });
```

Options are `@uicast/expr`'s without `budget`: `functions`, `maxCacheSize`, `maxSourceLength`. It implements the same `ExpressionEvaluator` interface: `eval`, `compile`, `validate`, `memberReads`.

## What holds, and what does not

- **Names.** Every identifier written in an expression becomes a parameter of the compiled function. The ones you bind (host functions, context values, the allowed globals) get values; any other name is `undefined`. Nothing resolves to a global by accident, and there is no list of globals to keep up to date.
- **Written member names** that reach the prototype chain (`constructor`, `__proto__`, `prototype`, `bind`, `call`, `apply`, …) are refused before the source runs.
- **The residual.** A property name assembled at run time is invisible to a static check: `"abc"["char" + "At"](0)` runs and returns `"a"`; `Object["get" + "PrototypeOf"]([])` reaches the real `Array.prototype`. The interpreter refuses both at the call. The exit gate still holds — a function or a class instance cannot leave the expression, as the result or as a host-function argument — but code inside the expression has already run by then.
- **No budget.** `"x".repeat(1e9)` is the engine's problem, not this package's, and an expression is not guaranteed to stop.

The parity suite in this package runs every shared test expression three times: in `Evaluator`, here, and as plain JavaScript. All three must return the same value or all three must throw (*differential testing*); the residual above is pinned as the one allowed difference.

## With uicast

```tsx
<RendererProvider evaluator={new PassthroughEvaluator({ functions })} />
```

## License

MIT
