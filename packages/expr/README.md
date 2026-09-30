<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://uicast.dev/uicast-logo-dark.svg">
    <img alt="" src="https://uicast.dev/uicast-logo.svg" width="64">
  </picture>
</p>
<h1 align="center">@uicast/expr</h1>
<p align="center">Part of <a href="https://github.com/finom/uicast"><strong>uicast</strong></a>, the expression-driven generative UI framework.</p>
<p align="center"><a href="https://uicast.dev">uicast.dev</a></p>
<p align="center"><a href="https://www.npmjs.com/package/@uicast/expr"><img src="https://img.shields.io/npm/v/@uicast/expr.svg?color=brightgreen" alt="npm version"></a> <a href="https://scorecard.dev/viewer/?uri=github.com/finom/uicast"><img src="https://api.scorecard.dev/projects/github.com/finom/uicast/badge" alt="OpenSSF Scorecard"></a> <a href="https://www.bestpractices.dev/projects/15106"><img src="https://www.bestpractices.dev/projects/15106/badge" alt="OpenSSF Best Practices"></a> <a href="https://github.com/finom/uicast/actions/workflows/ci.yml"><img src="https://github.com/finom/uicast/actions/workflows/ci.yml/badge.svg" alt="CI"></a></p>

The expression language of **uicast** documents: JavaScript expressions over JSON data. **uicast** runs expressions that a language model wrote, so this evaluator interprets the source itself, checks every read and call as it runs, and stops every evaluation within a budget.

```ts
import { Evaluator } from "@uicast/expr";

const ev = new Evaluator();
const rows = [
  { name: "Mug", stock: 4, status: "open" },
  { name: "Kettle", stock: 0, status: "sold" },
  { name: "Beans", stock: 12, status: "open" },
];

ev.eval("rows.filter(r => r.stock > 0).length", { rows }); // → 2
ev.eval("rows.map(r => r.name).join(', ')", { rows }); // → "Mug, Kettle, Beans"
ev.eval("`${rows.length} items, ${rows.filter(r => !r.stock).length} sold out`", { rows }); // → "3 items, 1 sold out"
ev.eval("Object.groupBy(rows, r => r.status)", { rows }); // → { open: [Mug, Beans], sold: [Kettle] }
ev.eval('rows["pu" + "sh"]({ stock: 9 })', { rows }); // ❌ ExpressionError: "push" is not an available method on array
```

- **JavaScript syntax.** One expression, no statements.
- **No `eval`, no `new Function`.** The source is parsed with acorn and interpreted, so a Content-Security-Policy needs no `unsafe-eval`.
- **A closed grammar.** Every syntax node, operator, global and method is on an allow-list. Anything else is refused before the expression runs.
- **Checked as it runs.** Only own properties of plain data are readable, and only JSON leaves an expression.
- **Always ends.** No loops, no recursion, no function values, and a step, time and allocation budget on every evaluation.

The functions and data you hand in are yours to secure: see [Security](#security).

```sh
npm install @uicast/expr
```

Full documentation: [uicast.dev/expr](https://uicast.dev/expr).

## The language

One expression over the data you pass in. Nothing is declared, assigned, or run twice.

| | |
|---|---|
| **Values** | numbers, strings, template literals, `true`, `false`, `null`, `undefined`; arrays and objects, with spread and computed keys |
| **Reads** | `a.b`, `a[b]`, `a?.b`, `a?.[b]`: own properties of plain data only, so `({}).constructor` is `undefined` |
| **Operators** | `+ - * / % **`, `== != === !==`, `< <= > >=`, `&& \|\| ??`, `! - + typeof`, `a ? b : c` |
| **Callbacks** | An arrow with an expression body, only where a method takes a function: `rows.map(r => r.name)`, `Array.from({ length: 3 }, (_, i) => i)`. Up to five parameters, with destructuring and defaults. A global that takes one argument can stand in for it: `rows.filter(Boolean)`, `ids.map(Number)` |
| **Globals** | `Math`, `JSON`, `Object`, `Array`, `Number`, `String`, `Boolean`, `Date`, `parseInt`, `parseFloat`, `isNaN`, `isFinite`, `encodeURIComponent`, `decodeURIComponent`, `undefined`, `NaN`, `Infinity` |
| **Methods** | The standard methods of arrays, strings and numbers, and the data functions of the globals, minus those that mutate, return an iterator, take a regular expression, exist only for a side effect, or are legacy. Locale methods take a locale and options: `price.toLocaleString(undefined, { style: "currency", currency: "USD" })` |

<details>
<summary>Every method</summary>

**Methods.**

- Array: `.map()` `.filter()` `.reduce()` `.reduceRight()` `.find()` `.findIndex()` `.findLast()` `.findLastIndex()` `.some()` `.every()` `.slice()` `.concat()` `.join()` `.includes()` `.indexOf()` `.lastIndexOf()` `.at()` `.flat()` `.flatMap()` `.toSorted()` `.toReversed()` `.toSpliced()` `.with()` `.toString()` `.toLocaleString()` `.valueOf()`, and `.length`
- String: `.at()` `.charAt()` `.charCodeAt()` `.codePointAt()` `.startsWith()` `.endsWith()` `.includes()` `.indexOf()` `.lastIndexOf()` `.slice()` `.substring()` `.concat()` `.split()` `.replace()` `.replaceAll()` `.repeat()` `.padStart()` `.padEnd()` `.toLowerCase()` `.toUpperCase()` `.toLocaleLowerCase()` `.toLocaleUpperCase()` `.trim()` `.trimStart()` `.trimEnd()` `.normalize()` `.isWellFormed()` `.toWellFormed()` `.localeCompare()` `.toString()` `.toLocaleString()` `.valueOf()`, and `.length`
- Number: `.toFixed()` `.toExponential()` `.toPrecision()` `.toString()` `.toLocaleString()` `.valueOf()`

**Static.** `Math.abs()` `Math.ceil()` `Math.floor()` `Math.round()` `Math.trunc()` `Math.sign()` `Math.sqrt()` `Math.cbrt()` `Math.pow()` `Math.min()` `Math.max()` `Math.hypot()` `Math.log()` `Math.log2()` `Math.log10()` `Math.log1p()` `Math.exp()` `Math.expm1()` `Math.sin()` `Math.cos()` `Math.tan()` `Math.asin()` `Math.acos()` `Math.atan()` `Math.atan2()` `Math.sinh()` `Math.cosh()` `Math.tanh()` `Math.asinh()` `Math.acosh()` `Math.atanh()` `Math.fround()` `Math.f16round()` `Math.clz32()` `Math.imul()` `Math.sumPrecise()` and the `Math` constants (`Math.PI`, …); `JSON.parse()` `JSON.stringify()`; `Object.keys()` `Object.values()` `Object.entries()` `Object.fromEntries()` `Object.groupBy()` `Object.hasOwn()` `Object.is()`; `Array.isArray()` `Array.from()` `Array.of()`; `Number.isInteger()` `Number.isFinite()` `Number.isNaN()` `Number.isSafeInteger()` `Number.parseInt()` `Number.parseFloat()` and the `Number` constants (`Number.MAX_SAFE_INTEGER`, …); `String.fromCharCode()` `String.fromCodePoint()`; `Date.parse()` `Date.UTC()`.

</details>

**Not in the language.**

| Left out | Why |
|---|---|
| Statements, loops, `function`, block bodies | A loop cannot be written, and nothing can call itself. |
| Assignment and mutating methods (`push`, `sort`, …) | An expression computes a value; state changes belong to the host. |
| `new`, so no `Date` objects, `Set` or `Map` | Every value is JSON. A date is an ISO string or a timestamp; an object does a `Map`'s job. |
| Regular expressions | A match runs inside the engine, where the budget cannot stop it. |
| `async` and `await` | A host function's promise can only be the whole result. |
| `Math.random()`, `Date.now()` | The same data gives the same result. A random value or the time comes from a host function. |
| `forEach`, iterators, generators | A callback has no effect to run, and a function is never a value. |
| `Intl` | The locale methods take its locales and options. |

Also left out: `this`, `eval`, BigInt, `in`, `instanceof`, bitwise operators, `f?.()`, rest parameters, holes (`[1, , 2]`), typed arrays, `Temporal`.

**Where it differs from JavaScript:** `typeof nope` throws instead of answering `"undefined"`, `Object.keys(1)` is refused instead of boxing, and a missing global is an error, not `undefined`.

**Engines:** ES2022. The newer methods (`findLast`, `toSorted`, `Object.groupBy`, …) are implemented here, so an older engine gives the same answers.

## Evaluator

Create one and reuse it: it holds the parse cache.

```ts
const ev = new Evaluator({
  functions: tools, // host functions, below
  maxSourceLength: 1000, // longest source, refused before parsing
  budget: { steps: 200_000 },
});
```

| Method | What it does |
|---|---|
| `eval(source, ...contexts)` | Runs the source. Each context is an object of names; a later one shadows an earlier one. |
| `compile(source)` | The same, prepared once: `ev.compile("a + b")({ a, b })`. |
| `validate(source)` | Checks without running. Returns the free names and the host functions called. |

Every failure is an `ExpressionError` with a `reason`, such as `"guardrail-violation"` or `"budget-exceeded"`.

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

The only callables an expression can reach. Each is a [standard tool](https://standard-tool.js.org), bound at construction:

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
ev.eval("user.name", { user }); // → "Ada"
```

- Input is validated before `execute`, output after.
- A call takes zero or one argument and must be the result: the whole expression, a `?:` branch, or the right side of `&&`, `||`, `??`. There is no `await`: you await the result and pass it to the next evaluation.
- No call inside a callback: one call per item would run before anything could refuse the result.

```ts
ev.eval("getUser({ id: 'seven' })"); // ❌ ExpressionError: rejected its argument
ev.eval("getUser({ id: 7 }).name"); // ❌ ExpressionError: its call must be the result itself
ev.eval("ids.map(id => getUser({ id }))", { ids }); // ❌ ExpressionError: cannot be called inside a callback
```

## Security

It runs in your JavaScript realm, not in a sandbox: values pass in and out without copying, and these checks are the boundary.

What the evaluator enforces:

- Nothing outside the grammar runs. The allow-lists are data in `src/constants/`. There is no deny-list: inherited names such as `constructor` are simply not readable.
- Only JSON leaves an expression, as its result or as a host function's argument. The language builds nothing else, so the gate stops what came in through a context:

  ```ts
  ev.eval("user", { user: new User() }); // ❌ ExpressionError: The result contains a User, which is not plain data
  ev.eval("scopes.fn", { scopes: { fn } }); // ❌ ExpressionError: "fn" holds a function, which cannot be read in an expression
  ```

- Every evaluation ends within its budget.

What stays yours:

- **Host functions are capabilities.** A call is checked against the declared shape. Whether the caller may make it is your authorization, on the server.
- **Contexts are readable.** Pass only what the expression may see.

Each control is pinned by a test, such as `attacks.test.ts` and `exit-gate.test.ts`. `corpus.test.ts` runs every test expression here and as plain JavaScript, and the two must agree. One runtime dependency: acorn.

## In uicast

`getExpressionsPartialPrompt()` from `@uicast/core/prompt` describes this language to the model, and `getFunctionsPartialPrompt({ functions })` prints the functions you bind here. See [uicast.dev/prompt](https://uicast.dev/prompt).

## License

[MIT](https://github.com/finom/uicast/blob/main/LICENSE) © [Andrey Gubanov](https://github.com/finom)
