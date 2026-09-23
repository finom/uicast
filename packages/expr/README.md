# @uicast/expr

The expression language of **uicast** documents: JavaScript expressions over JSON data. An expression sees only JSON and returns only JSON. It has no statements, no `new`, no mutation, no regular expressions and no function values.

```ts
import { Evaluator } from "@uicast/expr";

const ev = new Evaluator();

ev.eval("rows.filter(r => r.stock > 0).length", { rows });
// → 2

ev.eval('rows["pu" + "sh"]({ stock: 9 })', { rows });
// → ExpressionError: "push" is not an available method on array
```

Source is parsed with [acorn](https://github.com/acornjs/acorn), checked against allow-lists, then run by this package's interpreter. Every property read and every call is checked as it runs, under a step, time and allocation budget. Nothing hands source to the JavaScript engine, so a Content-Security-Policy needs no `unsafe-eval`.

Built for [uicast](https://github.com/finom/uicast), where expressions come from a language model. Full documentation: [uicast.dev/expr](https://uicast.dev/expr).

```sh
npm install @uicast/expr
```

## The language

One expression. Nothing is declared, assigned, or run twice.

**Syntax.** Literals (numbers, strings, template literals, booleans, `null`, `undefined`); arrays and objects, with spread and computed keys; `a.b`, `a[b]`, `a?.b`; method calls; arrow functions with an expression body — up to five parameters, destructuring, defaults. Operators: `+ - * / % **`, `== != === !==`, `< <= > >=`, `&& || ??`, `! - + typeof`, `a ? b : c`.

**Callbacks.** An arrow is written only where a method takes a function: `rows.map(r => r.name)`, `Array.from({ length: 3 }, (_, i) => i)`. A global that takes one argument can stand in for it: `rows.filter(Boolean)`, `ids.map(Number)`. A function is never a value: nothing can store, return or call one, so nothing recurses.

**Globals.** `Math`, `JSON`, `Object`, `Array`, `Number`, `String`, `Boolean`, `Date`, `parseInt`, `parseFloat`, `isNaN`, `isFinite`, `encodeURIComponent`, `decodeURIComponent`, `undefined`, `NaN`, `Infinity`.

**Methods.** The standard methods of each kind of value, minus those that mutate, return an iterator, take a regular expression, exist only for a side effect, or are legacy. The locale methods take a locale and options, as in JS: `price.toLocaleString(undefined, { style: "currency", currency: "USD" })`.

- Array: `.map()` `.filter()` `.reduce()` `.reduceRight()` `.find()` `.findIndex()` `.findLast()` `.findLastIndex()` `.some()` `.every()` `.slice()` `.concat()` `.join()` `.includes()` `.indexOf()` `.lastIndexOf()` `.at()` `.flat()` `.flatMap()` `.toSorted()` `.toReversed()` `.toSpliced()` `.with()` `.toString()` `.toLocaleString()` `.valueOf()`, and `.length`
- String: `.at()` `.charAt()` `.charCodeAt()` `.codePointAt()` `.startsWith()` `.endsWith()` `.includes()` `.indexOf()` `.lastIndexOf()` `.slice()` `.substring()` `.concat()` `.split()` `.replace()` `.replaceAll()` `.repeat()` `.padStart()` `.padEnd()` `.toLowerCase()` `.toUpperCase()` `.toLocaleLowerCase()` `.toLocaleUpperCase()` `.trim()` `.trimStart()` `.trimEnd()` `.normalize()` `.isWellFormed()` `.toWellFormed()` `.localeCompare()` `.toString()` `.toLocaleString()` `.valueOf()`, and `.length`
- Number: `.toFixed()` `.toExponential()` `.toPrecision()` `.toString()` `.toLocaleString()` `.valueOf()`

**Static.** `Math.abs()` `Math.ceil()` `Math.floor()` `Math.round()` `Math.trunc()` `Math.sign()` `Math.sqrt()` `Math.cbrt()` `Math.pow()` `Math.min()` `Math.max()` `Math.hypot()` `Math.log()` `Math.log2()` `Math.log10()` `Math.log1p()` `Math.exp()` `Math.expm1()` `Math.sin()` `Math.cos()` `Math.tan()` `Math.asin()` `Math.acos()` `Math.atan()` `Math.atan2()` `Math.sinh()` `Math.cosh()` `Math.tanh()` `Math.asinh()` `Math.acosh()` `Math.atanh()` `Math.fround()` `Math.f16round()` `Math.clz32()` `Math.imul()` `Math.sumPrecise()` and the `Math` constants (`Math.PI`, …); `JSON.parse()` `JSON.stringify()`; `Object.keys()` `Object.values()` `Object.entries()` `Object.fromEntries()` `Object.groupBy()` `Object.hasOwn()` `Object.is()`; `Array.isArray()` `Array.from()` `Array.of()`; `Number.isInteger()` `Number.isFinite()` `Number.isNaN()` `Number.isSafeInteger()` `Number.parseInt()` `Number.parseFloat()` and the `Number` constants (`Number.MAX_SAFE_INTEGER`, …); `String.fromCharCode()` `String.fromCodePoint()`; `Date.now()` `Date.parse()` `Date.UTC()`.

**Engines.** Needs ES2022. The newer methods above — `findLast`, `toSorted`, `Object.groupBy`, … — are implemented here, so an older engine gives the same answers.

**Not in the language.**

- Statements, declarations, loops, `function`, block bodies: a loop cannot be written, and nothing can call itself.
- Assignment and mutating methods (`push`, `sort`, `splice`, …): an expression computes a value. State changes belong to the host.
- `async` and `await`: a host function's promise can only be the whole result (below).
- `Math.random()`: the same data gives the same result. A random value comes from a host function (below).
- `Intl`: the locale methods take its locales and options.
- `new`, so no `Date` values, `Set` or `Map`: every value is JSON. A date is an ISO string, or a timestamp from `Date.parse(text)` or `Date.now()`. An object does a `Map`'s job, and `Object.keys(Object.groupBy(rows, r => r.tag))` lists the distinct tags.
- `forEach`, iterators and generators: a callback has no effect to run, and a function is never a value.
- Regular expressions: a match runs inside the engine, where the budget cannot stop it.
- `this`, `eval`, `new Function`, BigInt, `in`, `instanceof`, bitwise operators, `f?.()`, rest parameters, holes (`[1, , 2]`), typed arrays, `Temporal`, and any global or method not listed above.

Only own properties of plain data are readable: `({}).constructor` is `undefined`, and a class instance is refused at its first property. A method can only be called, never read.

**Where it differs from JS:** `typeof nope` throws instead of answering `"undefined"`; `Object.keys(1)` is refused instead of boxing; a missing global is an error, not `undefined`.

## Evaluator

One instance, reused: it holds the parse cache.

```ts
const ev = new Evaluator({
  functions: tools,      // host functions, below
  maxSourceLength: 1000,
  budget: { steps: 200_000 },
});
```

- **`eval(source, ...contexts)`**: each context is an object of named values, searched right to left, so a later one shadows an earlier one.
- **`compile(source)`**: the same, prepared once: `ev.compile("a + b")({ a, b })`.
- **`validate(source)`**: parse and check without running. Returns the free identifiers and the host functions called.
- **`memberReads(source, root)`**: every static `root.a.b` path read, enough to drive subscriptions.

`eval` and `compile` take the result type first, then a tuple of the context types. The result type is an assertion, not a check.

```ts
ev.eval<number>("1 + 1");

const price = ev.compile<string, [{ cents: number }]>("'$' + (cents / 100).toFixed(2)");
price({ cents: 1999 }); // → "$19.99"
```

## Budget

Each evaluation spends from a budget, set per evaluator with `budget: { … }`, and throws when it runs out.

| Option | Default | What it counts |
|---|---|---|
| `steps` | 1000000 | Each node evaluated is a step. A call adds its work: a sort costs about n·log n steps. |
| `ms` | 100 | Milliseconds, checked every 2048 steps. |
| `maxStringLength` | 1000000 | Characters in one string. |
| `maxArrayLength` | 100000 | Elements in one array. |
| `maxTotalAllocation` | 10000000 | Characters and elements built in one evaluation. |

Each operation is priced by its measured time, so an evaluation stops at the same step on any device. The clock is a backstop.

## Host functions

The only callables an expression can reach. Each is a [standard tool](https://standard-tool.js.org) (the `StandardToolV0` type ships in this package), bound at construction:

```ts
const ev = new Evaluator({
  functions: [
    {
      name: "getUser",
      description: "Look up a user by id",
      inputSchema: z.object({ id: z.number() }),
      outputSchema: z.object({ id: z.number(), name: z.string() }),
      execute: ({ id }) => db.users.findById(id), // returns a promise
    },
  ],
});

const user = await ev.eval("getUser({ id: 7 })"); // → { id: 7, name: "Ada" }
ev.eval("user.name", { user });                   // → "Ada"
```

Input is validated before `execute`, output after. A call takes zero or one argument. There is no `await`, so a call stands only where its value is the result: the whole expression, a branch of `?:`, or the right side of `&&`, `||`, `??`. The caller awaits it and passes the value to a later evaluation, as above. No call runs inside a callback, where a call per item would run before anything could refuse the result. A synchronous tool with synchronous schemas returns its value, not a promise.

```ts
ev.eval("getUser({ id: 'seven' })");                // → ExpressionError: rejected its argument
ev.eval("getUser({ id: 7 }).name");                 // → ExpressionError: its call must be the result itself
ev.eval("ids.map(id => getUser({ id }))", { ids }); // → ExpressionError: cannot be called inside a callback
```

### Random values and the time

A value that changes from call to call comes from a host function — a random number, a new id:

```ts
const ev = new Evaluator({
  functions: [{ name: "random", description: "A random number in [0, 1)", execute: () => Math.random() }],
});

ev.eval("random()"); // → 0.7137…
```

`Date.now()` is in the language, and a value computed from it is as fresh as its last evaluation. In a **uicast** document, a step keeps either one in a scope, and other expressions read it from there:

```json
{ "set": "scopes.root.roll", "expr": "random()" }
{ "set": "scopes.root.savedAt", "expr": "Date.now()" }
```

## The exit gate

Only JSON data leaves an expression, as its result or as a host function's argument. The language builds nothing else, so what the gate stops comes from a context: a class instance is refused on the way out, and a function when it is read.

```ts
ev.eval("user", { user: new User() });      // → ExpressionError: The result contains a User, which is not plain data
ev.eval("scopes.fn", { scopes: { fn } });   // → ExpressionError: "fn" holds a function, which cannot be read in an expression
```

## Two evaluators

`Evaluator` checks every read and call as it happens and stops every expression within its budget. Use it when anyone else can steer the expression.

[`@uicast/expr-passthrough`](https://www.npmjs.com/package/@uicast/expr-passthrough) ships `PassthroughEvaluator`: the same grammar and static checks, then `new Function`. It is faster and has no budget, needs `unsafe-eval`, and does not check a name assembled at run time, so it is for an author you trust. Both implement `ExpressionEvaluator`.

## What it does not cover

An expression reaches only what you hand in: the contexts and the host functions. Securing those is up to you:

- **Host functions are capabilities.** The call is checked against the declared shape. Whether the caller may make it is your authorization, on the server.
- **Contexts hold JSON data.** Everything you pass is readable, so pass only what the expression may see.

## Reviewing it

One runtime dependency (acorn), no `new Function` and no deny-list. Every rule is an allow-list held as data in `src/constants/`, and nothing inherited is readable, so no name is refused by name. Tests hold the runtime tables and this README's language section equal to the constants.

Each control is pinned by a test: `attacks.test.ts`, `exit-gate.test.ts`, `host-functions.test.ts` and `prototype-exposure.test.ts`; `corpus.test.ts` runs every test expression here and as plain JavaScript, and both must agree; `baseline.test.ts` runs that corpus with every built-in newer than ES2022 deleted; `prices.test.ts` keeps each operation's time per step within 4× a plain step's.

## Why JavaScript syntax

A model writes JavaScript without being taught; CEL, the usual embedded language, has to be taught in the prompt. So the syntax is JavaScript's, and the grammar is closed by allow-lists. It runs in the host's realm, not in a sandbox such as isolated-vm or QuickJS, so values pass in and out without being copied.

## Prompting a model

Two prompt sections ship from `@uicast/core/prompt`: `getExpressionsPartialPrompt()` describes this language, and `getFunctionsPartialPrompt({ functions })` renders the signatures of the tools you bound — the same array, so the model is told what the evaluator accepts. Assembly is documented at [uicast.dev/prompt](https://uicast.dev/prompt).

## License

MIT
