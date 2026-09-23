[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/finom/uicast/badge)](https://scorecard.dev/viewer/?uri=github.com/finom/uicast)

# uicast

**The expression-driven generative UI framework.**

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="packages/docs/public/uicast-hero-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="packages/docs/public/uicast-hero-light.svg">
  <img alt="Your components and your functions become one prompt; the model answers with a screen built from those same components." src="packages/docs/public/uicast-hero-light.svg" width="936">
</picture>

**uicast** renders a user interface that a language model writes at run time. The model picks components from a catalog you register and calls functions you expose. It writes no React, and nothing it produces is compiled or added to your bundle; what it produces is data, which the renderer evaluates and can store and render again.

Logic in a generated screen is written in an expression language: a subset of JavaScript, one expression per value. A total, a filter, a condition, the steps an event runs — all of it is source the evaluator interprets, never source the JavaScript engine runs. That language is [`@uicast/expr`](packages/expr), and its limits are below.

## What a generated document can do

- Elements reference their children by key. The renderer builds the tree and renders each element as it arrives.
- State lives in scopes. A `seed` runs once when an element mounts, usually to fetch.
- A prop is either a literal or an expression. An expression re-evaluates when the state it reads changes.
- An event runs steps. `set` is the only way to write state; steps otherwise compute.
- A list renders one child per item, each item with its own scope.
- Host functions are the only path to your backend.

## What you write

A **definition** is what the model reads about one component — its name, what it is for, its props:

```ts
export const StatDef = createComponentDefinition({
  name: "Stat",
  description: "One number with a label. Use it for a KPI, not for a table cell.",
  props: z.strictObject({
    label: z.string().meta({ description: "What the number means" }),
    value: z.number().meta({ description: "The number itself" }),
  }),
});
```

An **implementation** is the React component it pairs with. `@uicast/shadcn-catalog` ships 128 pairs over shadcn/ui if you do not want to start with your own.

A **host function** is one [`standard-tool`](https://standard-tool.js.org/) per operation the model may perform. Its input schema is checked before `execute` runs; its output schema is how the model knows what the result contains:

```ts
export const listOrders = standardTool({
  name: "listOrders",
  description: "Orders for the signed-in customer, newest first.",
  inputSchema: z.object({ status: z.enum(["all", "open", "refunded"]).default("all") }),
  outputSchema: z.array(orderSchema),
  execute: ({ status }) => fetch(`/api/orders?status=${status}`).then((r) => r.json()),
});
```

The **system prompt** is generated from those two registries, so the model can name nothing else, and every `description` reaches it word for word:

```ts
const system = [
  getCommonInstructionsPartialPrompt(),
  getScopePartialPrompt({ kind: "page" }),
  getComponentsPartialPrompt({ definitions: defs }),
  getFunctionsPartialPrompt({ functions: tools }),
  getExpressionsPartialPrompt(),
].join("\n\n");
```

**Rendering** is a provider and a renderer. The evaluator is constructed once, with the host functions bound to it:

```tsx
const evaluator = new Evaluator({ functions: tools });

<RendererProvider implementations={impls} evaluator={evaluator}>
  <EntriesRenderer entries={entries} />
</RendererProvider>;
```

## Expressions

A closed grammar, parsed once with acorn. Reads are own-property only. Methods and globals come from an allow-list. Every evaluation runs under a budget on steps, time and allocation. There is no `eval` and no `new Function` in the package, so a **uicast** app runs under a Content-Security-Policy without `unsafe-eval`.

```js
scopes.root.orders.reduce((a, o) => a + o.total, 0)   // ✅ → a number
listOrders({ status: "open" })                        // ✅ a host function you registered
fetch("/api/orders")                                  // ❌ "fetch" is not available in expressions
({}).constructor                                      // ❌ undefined — nothing inherited is reachable
```

An arrow is written only as a method's callback, so a function is never a value and nothing recurses. Methods newer than ES2022 — `toSorted`, `Object.groupBy`, `Math.sumPrecise` — are implemented in the interpreter, so they work the same on any ES2022 engine. Regular expressions, mutation, `async`, `Math.random()` and `Temporal` are left out; the [`@uicast/expr` README](packages/expr) lists what is in and why the rest is not.

The interpreter secures the language, not what you plug into it. Host functions are capabilities you grant, so authorize them on the server. Scope data is only as safe as what you put there. Props that reach the DOM, such as URLs, go through the renderer's `urlPolicy`.

A subclass of `Evaluator` that sets `toFunction` is the faster path: the same checks, then the source goes through `new Function`. Roughly 3–5× on one expression and 20–90× on anything that loops over data, where the engine runs the loop instead of the interpreter. It needs `unsafe-eval`, nothing meters it, and a property name assembled at run time is never checked, so it is for documents whose author you trust.

## Install

```sh
npm install @uicast/expr@beta @uicast/core@beta @uicast/react@beta @uicast/shadcn-catalog@beta standard-tool
```

Node 24 or later. The packages are beta, under the `beta` dist-tag.

Four steps to a first page, spelled out in [Getting started](packages/docs/src/app/%28docs%29/getting-started/page.mdx):

1. Register the catalog, or your own components with a definition and an implementation each.
2. Expose your data as host functions.
3. Build the system prompt from the same catalog and functions, and stream the model's answer through.
4. Render it with `<RendererProvider>` and `<EntriesRenderer>`.

## Packages

| Package | What it is |
| --- | --- |
| [`@uicast/core`](packages/core) | The engine, framework-agnostic: entry format, reactive scopes, dependency extraction, error classification, prompt builders. |
| [`@uicast/react`](packages/react) | The React binding: provider, renderer, per-element error boundary, the confirm seam. |
| [`@uicast/expr`](packages/expr) | The expression language and its interpreter. No **uicast** dependency; works standalone. |
| [`@uicast/shadcn-catalog`](packages/shadcn-catalog) | 128 components over shadcn/ui and Radix, each with the definition the model reads. |
| [`@uicast/streamdown`](packages/streamdown) | A Streamdown plugin: generated screens inside ` ```uicast ` fences in Markdown chat replies. |

## Documentation

The docs site is `packages/docs` (`npm run dev` there). It is not published yet.

- [Concepts](packages/docs/src/app/%28docs%29/concepts/page.mdx) — the vocabulary: document, entry, element, scope, expression, step.
- [The expression evaluator](packages/docs/src/app/%28docs%29/expr/page.mdx) — the language, the budgets, the threat model.
- [Component definition](packages/docs/src/app/%28docs%29/def/page.mdx) and [implementation](packages/docs/src/app/%28docs%29/react/impl/page.mdx) — what the model reads and what React renders.
- [Host functions](packages/docs/src/app/%28docs%29/functions/page.mdx), [Event handling](packages/docs/src/app/%28docs%29/events/page.mdx), [Assembling the prompt](packages/docs/src/app/%28docs%29/prompt/page.mdx).
- [Component Entry Format](packages/docs/src/app/%28docs%29/entry/page.mdx) — every field, value sources, state and scopes, reactivity.
- [Security model](packages/docs/src/app/%28docs%29/security/page.mdx) and [SECURITY.md](SECURITY.md).

`packages/nextjs-demo` is a chat workspace over generated pages, backed by a live database: [Next.js demo](packages/docs/src/app/%28docs%29/nextjs-demo/page.mdx).

## Development

```sh
npm install
npm test
npm run typecheck
npm run lint
```

`npm run build` compiles every package to `dist/`. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
