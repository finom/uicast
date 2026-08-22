# uicast

LLM-generated UIs rendered from JSONLines, composed from a pre-built component
library, and delivered as a normal JS/HTML/CSS page with no build or deployment
step per generation.

## Packages

- **`packages/uicast`** — the **framework-agnostic** engine (zero React imports).
  The JSONLines render-engine concepts, the sandboxed micro-expression evaluator,
  the reactive Proxy-based state store, the component-def factories, and the
  prompt-partial builders.
- **`packages/react`** — the **React binding** for the engine: the `<Renderer>`,
  the recursive renderer + registry context, the per-element error boundary, and
  the confirm UI. Depends on `core`; `react` / `react-dom` are peer deps.
- **`packages/shadcn-catalog`** — the component catalog. Component def/impl
  pairs over shadcn/Radix primitives, the `allDefinitions` / `allImplementations`
  registries, the default `error` / `unknown` / `confirm` slot components, and the
  common event schemas. Depends on `core` + `react`.
- **`packages/streamdown`** — the Streamdown plugin: entries ride inside
  ```` ```uicast ```` code fences in Markdown chat replies, rendered in place;
  ships the matching fence prompt partial.
- **`packages/docs`** — the documentation site (Nextra). The only documentation
  home: concepts, the entry format, expressions, state, the React binding, prompt
  assembly, and error recovery. Run `npm run dev` there to browse it.
- **`packages/nextjs-demo`** — the demo app: a chat workspace and a page
  workspace over generated UI, backed by a small domain database.

## Consuming

The importable packages: bare **`uicast`** is the framework-agnostic engine
(published on npm), and the satellites are scoped — `@uicast/react` (the React
binding), `@uicast/shadcn-catalog` (the components), and `@uicast/streamdown`
(the chat fence renderer). Import React symbols from the `@uicast/react`
barrel; reach catalog modules via subpaths:

```ts
import { createProxyScope } from "uicast";
import { Renderer } from "@uicast/react";
import { allImplementations } from "@uicast/shadcn-catalog/impls";
```

For the full framework, install the repo as a git dependency and bundle the raw
TypeScript source (e.g. Next.js `transpilePackages: ["uicast-repo"]`, with
`tsconfig` path aliases mapping `uicast` and the `@uicast/*` specifiers into
the installed tree — the repo package is named `uicast-repo`; the docs-site
Getting started page shows the exact alias block).

## Development

Node 24+ is required.

```sh
npm install
npm run typecheck   # tsc --noEmit across all workspaces
npm test            # core + react + streamdown vitest suites
npm run lint        # Biome linter (zero-diagnostic gate)
npm run md-to-json  # regenerate the prompt-fragment JSON mirrors from packages/uicast/src/prompt/md/*.md
```

> Package naming and the public API surface are being finalized.

## License

[MIT](./LICENSE)
