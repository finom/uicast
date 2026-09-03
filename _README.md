[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/finom/uicast/badge)](https://scorecard.dev/viewer/?uri=github.com/finom/uicast)

# uicast

**The expression-driven generative UI framework.**

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="packages/docs/public/uicast-hero-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="packages/docs/public/uicast-hero-light.svg">
  <img alt="A pipeline: your components and functions merge into one prompt, a model streams entries as JSON lines, and the entries render into a complete app built from those same components." src="packages/docs/public/uicast-hero-light.svg" width="936">
</picture>

LLM-generated UIs, rendered from JSONLines. The model writes one JSON object per line. The engine places each line in a tree, wires it to a reactive state store, and renders it with your React components. The lines are data, so there is no build or deploy step per page, and a page can be saved and replayed.

uicast gives a model what JSX gives a developer: components, state, events. JSX is designed to be easy for a person to maintain; uicast is designed to be reliable for a model to generate.

## A document

Three lines, for the prompt *"Open orders, with a refresh button"*:

```jsonl
{ "key": "root", "component": "Card", "props": { "literal": { "title": "Open orders" } }, "seed": [{ "set": "scopes.root.orders", "expr": "listOrders({ status: 'open' })" }], "children": ["count", "refresh"] }
{ "key": "count", "component": "Stat", "props": { "expr": "({ label: 'Open', value: scopes.root.orders.length })" } }
{ "key": "refresh", "component": "Button", "props": { "literal": { "text": "Refresh" } }, "callbacks": { "onClick": [{ "set": "scopes.root.orders", "expr": "listOrders({ status: 'open' })" }] } }
```

- `seed` runs once when the element mounts and fills the state it needs.
- `props.expr` is re-evaluated whenever the state it reads changes.
- `callbacks` are steps that write state on an event. Steps only compute; `set` is the only way to change state.
- `listOrders` is a **host function**: a function you registered, the only way a document reaches your backend.

Every element renders as soon as its line arrives, so the page builds up while the model is still writing.

## Expressions

Every value a document computes is an expression: a **subset of JavaScript**, run by [`@uicast/expr`](packages/expr). Models write it fluently, and it is still a language of its own: a closed grammar parsed once with acorn, reads by own property only, an allow-list of methods and globals, a step, time and allocation budget. Nothing reaches `eval` or `new Function`, so a uicast app runs under a Content-Security-Policy without `unsafe-eval`.

```js
scopes.root.orders.reduce((a, o) => a + o.total, 0)  // ✅ → a number
listOrders({ status: "open" })                        // ✅ a host function you registered
fetch("/api/orders")                                  // ❌ "fetch" is not available in expressions
({}).constructor                                      // ❌ undefined — nothing inherited is reachable
```

The interpreter secures the language, not what you plug into it. Host functions are capabilities you grant, so authorize them on the server. Scope data is only as safe as what you put there. Props that reach the DOM, such as URLs, go through the renderer's `urlPolicy`.

For documents from an author you trust, [`@uicast/expr-passthrough`](packages/expr-passthrough) runs the same checked language through `new Function`, about as fast as plain JavaScript. It needs `unsafe-eval`, and with it the model is the first line of defence.

## The prompt

The model works from the brief you would give a new front-end developer: the components and the functions, generated from your code. The catalog is your design system, so the model picks a component and never invents one. The functions are your endpoints, each a [`standard-tool`](https://standard-tool.js.org/), and it can call nothing else. Every description reaches the model word for word, from the prop or schema field you wrote it on.

## Install

```sh
npm install @uicast/expr@beta @uicast/core@beta @uicast/react@beta @uicast/shadcn-catalog@beta standard-tool
```

Node 24 or later. The packages are beta, under the `beta` dist-tag.

Four steps to a first page, spelled out in [Getting started](packages/docs/src/app/%28docs%29/getting-started/page.mdx):

1. Register the catalog, or your own components with a definition and an implementation each.
2. Expose your data as host functions.
3. Build the system prompt from the same catalog and functions, and stream the model's JSONLines through.
4. Render the stream with `<RendererProvider>` and `<EntriesRenderer>`.

## Packages

| Package | What it is |
| --- | --- |
| [`@uicast/core`](packages/core) | The engine, framework-agnostic: entry format, reactive scopes, dependency extraction, error classification, prompt builders. |
| [`@uicast/react`](packages/react) | The React binding: provider, renderer, per-element error boundary, the confirm seam. |
| [`@uicast/expr`](packages/expr) | The expression language and its interpreter. No uicast dependency; works standalone. |
| [`@uicast/expr-passthrough`](packages/expr-passthrough) | The same language run through `new Function`, for trusted authors. |
| [`@uicast/shadcn-catalog`](packages/shadcn-catalog) | 150 components over shadcn/ui and Radix, each with the definition the model reads. |
| [`@uicast/streamdown`](packages/streamdown) | A Streamdown plugin: documents inside ` ```uicast ` fences in Markdown chat replies. |

## Documentation

The docs site is `packages/docs` (`npm run dev` there). The site is not published yet.

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
