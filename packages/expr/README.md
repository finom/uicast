# @uicast/expr

A JavaScript-shaped expression language that JavaScript does not run.

```ts
import { Evaluator } from "@uicast/expr";

const evaluator = new Evaluator();

evaluator.eval("rows.filter(r => r.stock > 0).length", { rows });
// → 2

evaluator.eval('({})["con" + "structor"]');
// → ExpressionError: Access to "constructor" is not allowed
```

Source is parsed once with [acorn](https://github.com/acornjs/acorn), checked
against a **closed allow-list of AST node types**, then compiled to a tree of
closures. Nothing reaches `new Function`, which buys two things at once: a real
capability boundary instead of a static guardrail, and a page that runs under a
strict Content-Security-Policy with no `unsafe-eval`.

Built for [uicast](https://github.com/finom/uicast), where expressions arrive
from a language model and must be treated as untrusted. Useful anywhere you
evaluate expressions you did not write.

## What it guarantees

- **Computed keys are not a way around anything.** The membrane sees the
  resolved key, so `obj["con"+"structor"]` and `obj.constructor` are the same
  event and get the same rejection.
- **No prototype walking.** Plain objects are read by own property only, so
  `toString`, `valueOf`, `constructor` and everything else inherited is
  unreachable without naming any of them.
- **Only data is readable.** A class instance, DOM node, or function is refused
  at the boundary — hand it a live `MouseEvent` and it fails on the first hop
  rather than walking to `window`.
- **Nothing runs away.** A step counter, a wall-clock deadline, and string and
  array caps. There is no loop syntax to write and no way to express recursion.
- **No regular expressions**, because ReDoS runs where a step counter cannot see
  it.

## What it is not

It is not a general JavaScript engine, and it is not trying to be. The grammar
has no statements, no declarations, no assignment, and no `function` keyword.
Expressions shape display values; real computation belongs in a host function.

See the uicast documentation for the full grammar, the threat model, and
benchmarks.

## License

MIT
