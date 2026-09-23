# @uicast/expr

The expression language of **uicast** documents: JavaScript expressions over JSON data. It has the standard methods of strings, numbers, arrays, dates and sets, `Math`, `JSON`, `Object`'s data methods and a few functions — without statements, mutation, regular expressions or function values.

Source is parsed with [acorn](https://github.com/acornjs/acorn) and checked against a closed allow-list of AST node types, then interpreted by this package: every property read and every call is checked as it happens, under a step, time and allocation budget. Nothing hands source to the JavaScript engine, so it runs under a Content-Security-Policy with no `unsafe-eval`.

```ts
import { Evaluator } from "@uicast/expr";

const ev = new Evaluator();

ev.eval("rows.filter(r => r.stock > 0).length", { rows });
// → 2

ev.eval('rows["pu" + "sh"]({ stock: 9 })', { rows });
// → ExpressionError: "push" is not an available method on array
```

Built for [uicast](https://github.com/finom/uicast), where expressions come from a language model. Full documentation: [uicast.dev/expr](https://uicast.dev/expr).

```sh
npm install @uicast/expr
```

## The language

Expressions only. Nothing can be declared, assigned, or run twice.

**Syntax.** Literals (numbers, strings, template literals, booleans, `null`, `undefined`); arrays and objects, with spread and computed keys; `a.b`, `a[b]`, `a?.b`; method calls; `new` for `Date` and `Set`; arrow functions with an expression body — up to five parameters, destructuring, defaults. Operators: `+ - * / % **`, `== != === !==`, `< <= > >=`, `&& || ??`, `! - + typeof`, `a ? b : c`.

**Callbacks.** An arrow is written only where a method takes a function: `rows.map(r => r.name)`, `Array.from({ length: 3 }, (_, i) => i)`. Not in an array, not as a result, not called directly. So a function is never a value: nothing can store, return or call one, and nothing recurses.

**Globals.** `Math`, `JSON`, `Object`, `Array`, `Number`, `String`, `Boolean`, `Date`, `Set`, `parseInt`, `parseFloat`, `isNaN`, `isFinite`, `encodeURIComponent`, `decodeURIComponent`, `undefined`, `NaN`, `Infinity`.

**Methods.** The standard methods of each kind of value, minus those that mutate, return an iterator, take a regular expression, exist only for a side effect (`forEach`), or are legacy (`substr`). Every one is charged to the budget. The locale methods take no locale or options: they use the viewer's.

- Array: `.map()` `.filter()` `.reduce()` `.reduceRight()` `.find()` `.findIndex()` `.findLast()` `.findLastIndex()` `.some()` `.every()` `.slice()` `.concat()` `.join()` `.includes()` `.indexOf()` `.lastIndexOf()` `.at()` `.flat()` `.flatMap()` `.toSorted()` `.toReversed()` `.toSpliced()` `.with()` `.toString()` `.toLocaleString()` `.valueOf()`, and `.length`
- String: `.at()` `.charAt()` `.charCodeAt()` `.codePointAt()` `.startsWith()` `.endsWith()` `.includes()` `.indexOf()` `.lastIndexOf()` `.slice()` `.substring()` `.concat()` `.split()` `.replace()` `.replaceAll()` `.repeat()` `.padStart()` `.padEnd()` `.toLowerCase()` `.toUpperCase()` `.toLocaleLowerCase()` `.toLocaleUpperCase()` `.trim()` `.trimStart()` `.trimEnd()` `.normalize()` `.isWellFormed()` `.toWellFormed()` `.localeCompare()` `.toString()` `.toLocaleString()` `.valueOf()`, and `.length`
- Number: `.toFixed()` `.toExponential()` `.toPrecision()` `.toString()` `.toLocaleString()` `.valueOf()`
- Date: `.getTime()` `.getFullYear()` `.getMonth()` `.getDate()` `.getDay()` `.getHours()` `.getMinutes()` `.getSeconds()` `.getMilliseconds()` `.getTimezoneOffset()` `.getUTCFullYear()` `.getUTCMonth()` `.getUTCDate()` `.getUTCDay()` `.getUTCHours()` `.getUTCMinutes()` `.getUTCSeconds()` `.getUTCMilliseconds()` `.toISOString()` `.toJSON()` `.toUTCString()` `.toDateString()` `.toTimeString()` `.toLocaleDateString()` `.toLocaleTimeString()` `.toLocaleString()` `.toString()` `.valueOf()`
- Set: `.has()` `.union()` `.intersection()` `.difference()` `.symmetricDifference()` `.isSubsetOf()` `.isSupersetOf()` `.isDisjointFrom()`, and `.size`

**Static.** `Math.abs()` `Math.ceil()` `Math.floor()` `Math.round()` `Math.trunc()` `Math.sign()` `Math.sqrt()` `Math.cbrt()` `Math.pow()` `Math.min()` `Math.max()` `Math.hypot()` `Math.log()` `Math.log2()` `Math.log10()` `Math.log1p()` `Math.exp()` `Math.expm1()` `Math.sin()` `Math.cos()` `Math.tan()` `Math.asin()` `Math.acos()` `Math.atan()` `Math.atan2()` `Math.sinh()` `Math.cosh()` `Math.tanh()` `Math.asinh()` `Math.acosh()` `Math.atanh()` `Math.fround()` `Math.f16round()` `Math.clz32()` `Math.imul()` `Math.sumPrecise()` `Math.random()` and the `Math` constants (`Math.PI`, …); `JSON.parse()` `JSON.stringify()`; `Object.keys()` `Object.values()` `Object.entries()` `Object.fromEntries()` `Object.groupBy()` `Object.hasOwn()` `Object.is()`; `Array.isArray()` `Array.from()` `Array.of()`; `Number.isInteger()` `Number.isFinite()` `Number.isNaN()` `Number.isSafeInteger()` `Number.parseInt()` `Number.parseFloat()` and the `Number` constants (`Number.MAX_SAFE_INTEGER`, …); `String.fromCharCode()` `String.fromCodePoint()`; `Date.now()` `Date.parse()` `Date.UTC()`.

**Engines.** Needs ES2022. Every method above that is newer — `findLast`, `toSorted`, `Object.groupBy`, the `Set` operations, `Math.sumPrecise`, … — is implemented here, not taken from the engine, so an older engine gives the same answers.

**Not in the language.** Statements, declarations, assignment, `function`, block bodies, loops, `this`, `eval`, `new Function`, BigInt, `in`, `instanceof`, bitwise operators, optional calls (`f?.()`), rest parameters, a hole in an array literal (`[1, , 2]`), and any global or method not listed above. A method can only be called, never read. Only plain data is readable, by own property — `({}).constructor` is `undefined`, and a class instance or a DOM node is refused at the first property.

**Left out on purpose.**

- Mutating methods (`push`, `sort`, `splice`, …) and assignment: an expression computes a value. State changes belong to the host.
- `async` and `await`: evaluation is synchronous. A host function's promise can only be the whole result (below).
- `Intl`, and a locale or options argument: currency, month names and relative times are a component's job.
- `Map`: data arrives and leaves as JSON, so an object does its job, and `Object.groupBy` builds one.
- `forEach`: it runs a callback for its effect, and a callback here has none.
- Regular expressions: a match runs inside the engine, where the budget cannot stop it.
- Iterators and generators: lazy values built on functions, and a function is never a value.
- Typed arrays and `ArrayBuffer`: binary data.
- `Temporal`: not in every ES2022 engine, and too large to implement here.

**Where it differs from JS**, on purpose: `typeof nope` throws instead of answering `"undefined"`; `Object.keys(1)` is refused instead of boxing; a missing global is an error, not `undefined`.

## Evaluator

One instance, reused — it holds the parse cache.

```ts
const ev = new Evaluator({
  functions: tools,      // host functions, below
  maxSourceLength: 1000,
  budget: { steps: 200_000 },
});
```

- **`eval(source, ...contexts)`** — each context is an object of named values, searched right to left, so a later one shadows an earlier one.
- **`compile(source)`** — the same, prepared once: `ev.compile("a + b")({ a, b })`.
- **`validate(source)`** — parse and check without running. Returns the free identifiers and the host functions called.
- **`memberReads(source, root)`** — every static `root.a.b` path read, enough to drive subscriptions.

Both take type parameters — the result first, then a tuple describing the contexts:

```ts
ev.eval<number>("1 + 1");

const price = ev.compile<string, [{ cents: number }]>("'$' + (cents / 100).toFixed(2)");
price({ cents: 1999 });   // argument and result both typed
```

The result type is an assertion, not a check: nothing validates what the expression actually returns.

## Budget

Every evaluation spends from a budget, set per evaluator with `budget: { … }`, and throws when it runs out.

| Option | Default | What it counts |
|---|---|---|
| `steps` | 1000000 | Each node evaluated is a step. A call adds its work: a sort costs about n·log n steps. |
| `ms` | 100 | Milliseconds, checked every 2048 steps. |
| `maxStringLength` | 1000000 | Characters in one string. |
| `maxArrayLength` | 100000 | Elements in one array. |
| `maxTotalAllocation` | 10000000 | Characters and elements built in one evaluation. |

The step limit is the contract. Each operation's price follows its measured time, so a long evaluation stops at the same step on any device. The clock is a backstop. With the CPU slowed 6× (a mid-range phone), the step limit still ends every long evaluation first. Slowed 12×, the heavier operations — locale formatting, `Object.fromEntries`, `String()` — can reach the clock first. So can comparing two long strings (`===`, an array's `includes`), which runs at memory speed for one step.

## Host functions

The only way a callable enters the language. They have the shape of [standard tools](https://standard-tool.js.org) — the `StandardToolV0` and Standard Schema interfaces are copied into this package verbatim, so a tool built with that library works as-is and nothing else is required — and bind at construction:

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

Input is validated before `execute`, output after. The language has no `await`, so a call stands only where its value is the result — the whole expression, a branch of `?:`, or the right side of `&&`, `||`, `??` — and the caller awaits it and reads the value in a later evaluation, as above.

```ts
ev.eval("getUser({ id: 'seven' })");                // → ExpressionError: rejected its argument
ev.eval("getUser({ id: 7 }).name");                 // → ExpressionError: its call must be the result itself
ev.eval("ids.map(id => getUser({ id }))", { ids }); // → ExpressionError: cannot be called inside a callback
```

A synchronous tool with synchronous schemas returns its value instead of a promise, under the same rules. Inside a callback no tool is called, synchronous or not: a call per item would run every item's effect before anything could refuse the result.

Binding at construction is what makes the call checkable: a tool may only be the callee of a call with zero or one argument, where its value is the result, outside every callback. So `getUser(a, b)`, `[getUser]`, `[getUser()]` and `ids.map(id => getUser({ id }))` are refused before anything runs. A function put in a context is not callable — contexts are data.

## The exit gate

Only plain data leaves an expression, as the result or as an argument to a host function: objects, arrays and primitives. A `Date` or a `Set` is for computing inside the expression; pass `date.toISOString()` or `[...set]` out. A class instance, however it was reached, is refused on the way out. A function in a context is refused earlier, when it is read.

```ts
ev.eval("user", { user: new User() });      // → ExpressionError: The result contains a User, which is not plain data
ev.eval("new Date(0)");                     // → ExpressionError: The result contains a Date, which is not plain data
ev.eval("scopes.fn", { scopes: { fn } });   // → ExpressionError: "fn" holds a function, which cannot be read in an expression
```

## Two evaluators

`Evaluator` trusts nothing: every read and call is checked as it happens, so a property name assembled at run time gets the same answer as a written one. Every expression stops: each step, each millisecond and each new string or array spends from a fixed budget, and evaluation throws when it is spent (*fuel* in proof assistants, *gas* in Ethereum). Use it when anyone else can steer the expression.

[`@uicast/expr-passthrough`](https://www.npmjs.com/package/@uicast/expr-passthrough) ships `PassthroughEvaluator`: the same grammar and static checks, then the source runs through `new Function`. Faster, needs `unsafe-eval`, and a name assembled at run time goes unchecked — for expressions from an author you trust. Same options minus `budget`; both implement `ExpressionEvaluator`.

## What it does not cover

An expression can only use what you hand in: the contexts and the functions bound at construction. Nothing else is reachable (*no ambient authority*). What you hand in is on you:

- **Host functions are capabilities.** The call is checked against the declared shape; whether the caller may make it is your authorization, server-side.
- **Context values must be plain data.** A live object graph is refused at the boundary, but what is reachable is still whatever you passed in.

## Reviewing it

One runtime dependency (acorn) and no `new Function` anywhere in the package. Every rule is an allow-list held as data in `src/constants/` — grammar, globals, methods per receiver, caps — and the interpreter carries no deny-list: nothing inherited is readable, so no name has to be refused by name. A test holds the runtime tables equal to the constants, and the language section above equal to both.

Each control is pinned by a test: `attacks.test.ts` (the adversarial corpus), `exit-gate.test.ts`, `host-functions.test.ts`, `prototype-exposure.test.ts`, `corpus.test.ts` (every test expression runs here and as plain JavaScript, and both must return the same value or both must throw — *differential testing*), `baseline.test.ts` (the same corpus on an ES2022 engine: every newer built-in deleted, the package loaded fresh), `prices.test.ts` (every operation's time per step within 4× a plain step's), and the parity suite in `@uicast/expr-passthrough` (the same list through both evaluators; the passthrough residual is asserted, not just described).

## Why JavaScript syntax

CEL is the obvious alternative: small, non-Turing-complete, built to be embedded. This exists because of where the expressions come from — a model has to be taught CEL in the prompt and gets it wrong often enough that the error budget goes on syntax rather than logic, while JavaScript is what it writes unprompted. The cost is that JavaScript's surface is far larger, so the grammar has to be closed deliberately.

Sandboxes (isolated-vm, QuickJS in a worker) take the other route: run the code elsewhere, and every value crosses a serialization boundary. This runs in the host's own realm, so values pass through as they are — and the guarantee has to come from the grammar instead.

## Prompting a model

Two ready-made prompt sections ship from `@uicast/core/prompt`: `getExpressionsPartialPrompt()` describes this language, and `getFunctionsPartialPrompt({ functions })` renders the signatures of the tools you bound — the same array, so what the model is told it can call is what the evaluator will accept. Assembly is documented at [uicast.dev/prompt](https://uicast.dev/prompt).

## License

MIT
