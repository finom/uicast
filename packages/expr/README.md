# @uicast/expr

A subset of JavaScript for stateless expressions.

Source is parsed with [acorn](https://github.com/acornjs/acorn) and checked
against a closed allow-list of AST node types, then interpreted by this package:
every property read and every call is checked as it happens, under a step,
time and allocation budget. Nothing hands source to the JavaScript engine, so it
runs under a Content-Security-Policy with no `unsafe-eval`.

```ts
import { Evaluator } from "@uicast/expr";

const ev = new Evaluator();

ev.eval("rows.filter(r => r.stock > 0).length", { rows });
// → 2

ev.eval('"abc"["char" + "At"](0)');
// → ExpressionError: "charAt" is not an available method on string
```

Built for [uicast](https://github.com/finom/uicast), where expressions come from
a language model. Useful anywhere you evaluate expressions you did not write.
Full documentation: [uicast.dev/expr](https://uicast.dev/expr).

```sh
npm install @uicast/expr
```

## The language

Expressions only. Nothing can be declared, assigned, or run twice.

**Syntax.** Literals (numbers, strings, template literals, booleans, `null`,
`undefined`); arrays and objects, with spread and computed keys; `a.b`, `a[b]`,
`a?.b`; method calls; `new` for `Date`, `Map`, `Set`, `URL`,
`Intl.NumberFormat`, `Intl.DateTimeFormat`; arrow functions with an expression
body — up to five parameters, destructuring, defaults. Operators:
`+ - * / % **`, `== != === !==`, `< <= > >=`, `&& || ??`, `! - + typeof`,
`a ? b : c`.

**Globals.** `Math`, `JSON`, `Object`, `Array`, `Number`, `String`, `Boolean`,
`Date`, `Map`, `Set`, `URL`, `Intl`, `parseInt`, `parseFloat`, `isNaN`,
`isFinite`, `encodeURIComponent`, `decodeURIComponent`, `undefined`, `NaN`,
`Infinity`.

**Methods.** Only these; none mutates, every one is charged to the budget.

- Array: `.map()` `.filter()` `.forEach()` `.reduce()` `.reduceRight()` `.find()`
  `.findIndex()` `.findLast()` `.findLastIndex()` `.some()` `.every()` `.slice()`
  `.join()` `.includes()` `.indexOf()` `.lastIndexOf()` `.at()` `.flat()`
  `.flatMap()` `.toSorted()` `.toReversed()` `.toString()` `.toLocaleString()`
  `.valueOf()`, and `.length`
- String: `.at()` `.startsWith()` `.endsWith()` `.includes()` `.indexOf()`
  `.lastIndexOf()` `.slice()` `.substring()` `.split()` `.replace()`
  `.replaceAll()` `.repeat()` `.padStart()` `.padEnd()` `.toLowerCase()`
  `.toUpperCase()` `.trim()` `.trimStart()` `.trimEnd()` `.normalize()`
  `.localeCompare()` `.toString()` `.toLocaleString()` `.valueOf()`, and `.length`
- Number: `.toFixed()` `.toString()` `.toLocaleString()` `.valueOf()`
- Date: `.getTime()` `.getFullYear()` `.getMonth()` `.getDate()` `.getDay()`
  `.getHours()` `.getMinutes()` `.getSeconds()` `.getMilliseconds()`
  `.getTimezoneOffset()` `.getUTCFullYear()` `.getUTCMonth()` `.getUTCDate()`
  `.getUTCDay()` `.getUTCHours()` `.getUTCMinutes()` `.getUTCSeconds()`
  `.toISOString()` `.toJSON()` `.toDateString()` `.toTimeString()`
  `.toLocaleDateString()` `.toLocaleTimeString()` `.toLocaleString()`
  `.toString()` `.valueOf()`
- Map: `.get()` `.has()` `.keys()` `.values()` `.entries()`, and `.size`
- Set: `.has()` `.values()`, and `.size`
- Intl formatter: `.format()`

**Static.** `Math.abs()` `Math.ceil()` `Math.floor()` `Math.round()`
`Math.trunc()` `Math.sign()` `Math.sqrt()` `Math.cbrt()` `Math.pow()`
`Math.min()` `Math.max()` `Math.hypot()` `Math.log()` `Math.log2()`
`Math.log10()` `Math.log1p()` `Math.exp()` `Math.expm1()` `Math.sin()`
`Math.cos()` `Math.tan()` `Math.asin()` `Math.acos()` `Math.atan()`
`Math.atan2()` `Math.sinh()` `Math.cosh()` `Math.tanh()` `Math.fround()`
`Math.clz32()` `Math.imul()` and the `Math` constants (`Math.PI`, …);
`JSON.parse()` `JSON.stringify()`; `Object.keys()` `Object.values()`
`Object.entries()` `Object.fromEntries()`; `Array.isArray()` `Array.from()`;
`Number.isInteger()` `Number.isFinite()` `Number.isNaN()`
`Number.isSafeInteger()` `Number.parseInt()` `Number.parseFloat()` and the
`Number` constants (`Number.MAX_SAFE_INTEGER`, …); `Date.now()` `Date.UTC()`.

**Not in the language.** Statements, declarations, assignment, `function`,
block bodies, loops, `this`, `await`, `eval`, `new Function`, regular
expressions, BigInt, `in`, `instanceof`, bitwise operators, optional calls
(`f?.()`), immediately-invoked arrows, rest parameters, `Math.random()`, every
mutating method (`push`, `sort`, `reverse`, `splice`, …), and any global or
method not listed above. A method can only be called, never read. Only plain
data is readable, by own property — `({}).constructor` is `undefined`, and a
class instance or a DOM node is refused at the first property.

**Where it differs from JS**, on purpose: `typeof nope` throws instead of
answering `"undefined"`; `Object.keys(1)` is refused instead of boxing; a
missing global is an error, not `undefined`.

## Evaluator

One instance, reused — it holds the parse cache.

```ts
const ev = new Evaluator({
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

Both take type parameters — the result first, then a tuple describing the
contexts:

```ts
ev.eval<number>("1 + 1");

const price = ev.compile<string, [{ cents: number }]>("'$' + (cents / 100).toFixed(2)");
price({ cents: 1999 });   // argument and result both typed
```

The result type is an assertion, not a check: nothing validates what the
expression actually returns.

## Host functions

The only way a callable enters the language. They have the shape of
[standard tools](https://standard-tool.js.org) — the `StandardToolV0` and
Standard Schema interfaces are copied into this package verbatim, so a tool
built with that library works as-is and nothing else is required — and bind
at construction:

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

## The exit gate

Nothing but plain data leaves an expression: not as the result, not as an
argument to a host function. A function or a class instance, however it was
reached, is refused on the way out.

```ts
ev.eval("[x => x]");                          // → ExpressionError
ev.eval("scopes.fn", { scopes: { fn } });     // → ExpressionError
```

## Two evaluators

`Evaluator` trusts nothing: every read and call is checked as it happens, so a
property name assembled at run time gets the same answer as a written one, and
a budget bounds the work. Use it when anyone else can steer the expression.

[`@uicast/expr-passthrough`](https://www.npmjs.com/package/@uicast/expr-passthrough)
ships `PassthroughEvaluator`: the same grammar and static checks, then the
source runs through `new Function`. Faster, needs `unsafe-eval`, and a name
assembled at run time goes unchecked — for expressions from an author you trust.
Same options minus `budget`; both implement `ExpressionEvaluator`.

## What it does not cover

- **Host functions are capabilities.** The call is checked against the declared
  shape; whether the caller may make it is your authorization, server-side.
- **Context values must be plain data.** A live object graph is refused at the
  boundary, but what is reachable is still whatever you passed in.

## Reviewing it

One runtime dependency (acorn) and no `new Function` anywhere in the package.
Every rule is an allow-list held as
data in `src/constants/` — grammar, globals, methods per receiver, caps — and
the interpreter carries no deny-list: nothing inherited is readable, so no name
has to be refused by name. A test holds the runtime tables equal to the
constants, and the language section above equal to both.

Each control is pinned by a test: `attacks.test.ts` (the adversarial corpus),
`exit-gate.test.ts`, `host-functions.test.ts`, `prototype-exposure.test.ts`,
`corpus.test.ts` (agreement with plain JavaScript), and the parity suite in
`@uicast/expr-passthrough` (both evaluators refuse the same grammar; the
passthrough residual is asserted, not just described).

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

## Prompting a model

Two ready-made prompt sections ship from `@uicast/core/prompt`:
`getExpressionsPartialPrompt()` describes this language, and
`getFunctionsPartialPrompt({ functions })` renders the signatures of the tools
you bound — the same array, so what the model is told it can call is what the
evaluator will accept. Assembly is documented at
[uicast.dev/prompt](https://uicast.dev/prompt).

## License

MIT
