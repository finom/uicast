# @uicast/expr

A subset of JavaScript for stateless expressions.

Source is parsed with [acorn](https://github.com/acornjs/acorn) and checked
against a closed allow-list of AST node types. Two back ends run what passes:
an interpreter that checks every read and call as it happens, or `new Function`
when the input is trusted.

```ts
import { Evaluator } from "@uicast/expr";

const ev = new Evaluator();

ev.eval("rows.filter(r => r.stock > 0).length", { rows });
// → 2

ev.eval('({})["con" + "structor"]');
// → ExpressionError: Access to "constructor" is not allowed
```

Built for [uicast](https://github.com/finom/uicast), where expressions come from
a language model. Useful anywhere you evaluate expressions you did not write.

```sh
npm install @uicast/expr
```

## Evaluator

One instance, reused — it holds the parse cache.

```ts
const ev = new Evaluator({
  mode: "interpret",     // or "native"
  functions: tools,      // host functions, below
  maxSourceLength: 1000,
  budget: { steps: 200_000 },
});
```

- **`eval(source, ...contexts)`** — each context is an object of named values,
  searched right to left, so a later one shadows an earlier one.
- **`compile(source)`** — the same, prepared once: `ev.compile("a + b")({ a, b })`.
- **`validate(source)`** — parse and check without running. Returns the free
  identifiers and the host functions called.
- **`memberReads(source, root)`** — every static `root.a.b` path read, enough to
  drive subscriptions.

`eval` and `compile` take an output type parameter (`ev.eval<number>("1 + 1")`),
which asserts the result type rather than checking it.

## Host functions

The only way a callable enters the language. They are
[standard tools](https://www.npmjs.com/package/standard-tool), bound at
construction:

```ts
const ev = new Evaluator({
  functions: [
    {
      name: "getUser",
      description: "Look up a user by id",
      inputSchema: z.object({ id: z.number() }),
      outputSchema: z.object({ id: z.number(), name: z.string() }),
      execute: ({ id }) => db.users.find(id),
    },
  ],
});

ev.eval("getUser({ id: 7 }).name");   // → "Ada"
ev.eval("getUser({ id: 'seven' })");  // → ExpressionError: rejected its argument
```

Input is validated before `execute`, output after. A synchronous tool with
synchronous schemas stays synchronous; an async one returns a promise for the
caller to await, since the language has no `await`.

Binding at construction is what makes the call checkable: a tool may only be the
callee of a call with zero or one argument, so `getUser(a, b)` and `[getUser]`
are refused before anything runs. A function put in a context is not callable —
contexts are data.

## Two modes

**`interpret`** (default) evaluates the AST as closures, checking every property
read and call as it happens, under a step, wall-clock and allocation budget. It
never calls `new Function`, so it needs no `unsafe-eval`.

**`native`** validates against the same grammar, then runs the source with
`new Function`. Faster, needs `unsafe-eval`, and its residual is real: a property
name assembled at run time is invisible to a static check, and allocation is
uncapped. For documents you generate yourself.

That residual is one line:

```js
({}).constructor          // any static check sees this
({})["con" + "structor"]  // the same read — the name exists only at run time
```

Under `interpret` the read is the checkpoint, so both are one event and get one
rejection.

## What it does not cover

- **Host functions are capabilities.** The call is checked against the declared
  shape; whether the caller may make it is your authorization, server-side.
- **Context values must be plain data.** A live object graph is refused at the
  boundary, but what is reachable is still whatever you passed in.
- **`native` trusts the author**, by design — see above.

## Why JavaScript syntax

CEL is the obvious alternative: small, non-Turing-complete, built to be
embedded. This exists because of where the expressions come from — a model has
to be taught CEL in the prompt and gets it wrong often enough that the error
budget goes on syntax rather than logic, while JavaScript is what it writes
unprompted. The cost is that JavaScript's surface is far larger, so the grammar
has to be closed deliberately.

Sandboxes (isolated-vm, QuickJS in a worker) take the other route: run the code
elsewhere, and every value crosses a serialization boundary. This runs in the
host's own realm, so values pass through as they are — and the guarantee has to
come from the grammar instead.

The prompt section describing this language ships as
`getExpressionsPartialPrompt()` from
[`@uicast/core/prompt`](https://www.npmjs.com/package/@uicast/core).

## License

MIT
