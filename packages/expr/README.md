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

## Install

```sh
npm install @uicast/expr
```

## The Evaluator

One instance, reused — it carries the parse cache, so construct it once.

```ts
const ev = new Evaluator({
  mode: "interpret",     // or "native" — see Two modes
  functions: tools,      // host functions, see below
  maxSourceLength: 1000, // longest accepted source, in characters
  budget: { steps: 200_000 },
});
```

**`eval(source, ...contexts)`** runs it. Each context is an object of named
values; they are searched right to left, so a later one shadows an earlier one
without anything being merged or copied.

```ts
ev.eval("user.name + ' — ' + role", { user }, { role: "admin" });
```

**`compile(source)`** returns a reusable function for the same expression:

```ts
const price = ev.compile("'$' + (cents / 100).toFixed(2)");
price({ cents: 1999 });   // "$19.99"
```

Both take an output type parameter — `ev.eval<number>("1 + 1")` — which is an
assertion about the result, not a check on it.

**`validate(source)`** parses and checks without running, which is how you reject
a bad expression at write time rather than at render time. It returns the free
identifiers and the host functions the expression calls.

**`memberReads(source, root)`** returns every static `root.a.b` path the
expression reads — enough to drive subscriptions in a reactive host.

## Host functions

Host functions are the one way a callable enters the language. They are
[standard tools](https://www.npmjs.com/package/standard-tool), bound when the
evaluator is constructed:

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

ev.eval("getUser({ id: 7 }).name");        // → "Ada"
ev.eval("getUser({ id: 'seven' })");       // → ExpressionError: rejected its argument
```

Every call is validated against the tool's own schemas — input before `execute`,
output after. A synchronous tool with synchronous schemas stays synchronous and
allocates no promise; an async tool returns a promise the caller awaits, since
the language has no `await` of its own.

Binding at construction is also what makes the call itself checkable. A declared
tool may only appear as the callee of a call with zero or one argument, so
`getUser(a, b)` and `[getUser]` are refused before anything runs — a host
function can never be passed around as a value.

Data goes in through the contexts, never through `functions`: a plain function
placed in a context is not callable.

## Two modes

Same validator, two ways to run what it accepts.

**`interpret`** (the default) walks the AST into closures this package
evaluates. Every property read and every call is checked as it happens, with a
CPU, wall-clock and allocation budget alongside. `new Function` is never called,
so it runs under a strict Content-Security-Policy with no `unsafe-eval`. Use it
whenever someone else can steer the document.

**`native`** validates against the *same grammar*, then hands the source to
`new Function`. Near-native speed, needs `unsafe-eval`, and its residual is
real: a property name assembled at run time (`rows["so" + "rt"]()`) is invisible
to a static check, and allocation is uncapped. Only for documents from a trusted
author — your own pipeline, an admin.

The difference comes down to one line:

```js
({}).constructor          // any static check sees this
({})["con" + "structor"]  // the same read — the name exists only at run time
```

Under `interpret` the read itself is the checkpoint, so both are the same event
and get the same rejection.

## What it does

- **Computed keys are not a way around anything.** The membrane sees the
  resolved key, so `obj["con"+"structor"]` and `obj.constructor` are one event.
- **No prototype walking.** Plain objects are read by own property only, so
  `toString`, `valueOf`, `constructor` and everything else inherited is
  unreachable without naming any of them.
- **Only data is readable.** A class instance, a DOM node, or a function is
  refused at the boundary — hand it a live `MouseEvent` and it fails on the
  first hop rather than walking to `window`.
- **Nothing runs away.** A step counter, a wall-clock deadline, string and array
  caps, and a source-length cap. There is no loop syntax to write, and nothing
  is named, so nothing can recurse.
- **Nothing mutates.** No assignment, no mutating method — `toSorted` and
  `toReversed`, not `sort` and `reverse`.
- **No regular expressions**, because catastrophic backtracking runs where a
  step counter cannot see it.

## What it does not do

It is not a general JavaScript engine and is not trying to be: no statements, no
declarations, no assignment, no `function` keyword. Expressions shape display
values; real computation belongs in a host function.

And it is not a sandbox for your own code. Three things stay yours:

- **Host functions are capabilities.** The evaluator checks that a call matches
  the declared shape; whether the caller is *allowed* to make it is your
  authorization, server-side.
- **Context values must be plain data.** Hand it a live object graph and the
  membrane refuses it, which is the safe failure — but reachability is still
  decided by what you put in.
- **`native` trusts the document's author**, by design. Its residual is listed
  above, and it is opt-in for that reason.

## Compared to

**CEL implementations** (`cel-js`, `@marcbachmann/cel-js`) evaluate Google's
Common Expression Language, so the prompt has to describe the syntax first. They
document structural caps — AST size, depth, list and map sizes — but no
wall-clock, step or allocation budget, and no restriction on which properties an
expression may read.

**Sandboxes** (isolated-vm, QuickJS in a worker, SES) isolate by moving
execution somewhere else, which puts a serialization boundary on every value
that crosses. This evaluates in the host's own realm: plain JS values go in and
come out with no marshalling, and the guarantee comes from the grammar and the
membrane rather than from an isolate.

Neither comparison makes this safe in the absolute — see *What it does not do*.

## Prompting a model

The ready-made prompt section describing this language — its syntax, its
methods, its globals and the length limit, filled from this package's own tables
— ships as `getExpressionsPartialPrompt()` from
[`@uicast/core/prompt`](https://www.npmjs.com/package/@uicast/core).

## License

MIT
