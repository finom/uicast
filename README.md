# ui-fired

LLM-generated UIs rendered from JSONLines, composed from a pre-built component
library, and delivered as a normal JS/HTML/CSS page with no build or deployment
step per generation.

## Packages

- **`packages/core`** — the **framework-agnostic** engine (zero React imports).
  The JSONLines render-engine concepts, the sandboxed micro-expression evaluator,
  the reactive Proxy-based state store, the **ui-fired** format spec, the
  component-def factories, and the prompt primitives. See
  [`packages/core/docs/SPEC.md`](./packages/core/docs/SPEC.md),
  [`packages/core/docs/OVERVIEW.md`](./packages/core/docs/OVERVIEW.md) and
  [`packages/core/docs/SCOPES.md`](./packages/core/docs/SCOPES.md).
- **`packages/react`** — the **React binding** for the engine: the `<Renderer>`,
  the recursive renderer + registry context, the per-element error boundary, and
  the confirm UI. Depends on `core`; `react` / `react-dom` are peer
  deps. See [`packages/core/docs/REACT.md`](./packages/core/docs/REACT.md).
- **`packages/catalog`** — the component catalog. Component def/impl pairs,
  the underlying shadcn/Radix UI primitives, the `componentDefinitions` / `componentImplementations`
  registries, and the example element arrays. Depends on `core` + `react`.

## Consuming

This is a workspace of three scoped packages — `@ui-fired/core` (the agnostic
engine), `@ui-fired/react` (the React binding), and `@ui-fired/catalog` (the
components) — living in one repo. Import React symbols from the
`@ui-fired/react` barrel; reach `@ui-fired/core` and `@ui-fired/catalog`
modules directly via subpaths:

```ts
import { createProxyScope } from "@ui-fired/core/scope/create-proxy-scope";
import { RecursiveRenderer } from "@ui-fired/react";
import { componentImplementations } from "@ui-fired/catalog/render/renderers";
```

A consumer bundles the raw TypeScript source (e.g. Next.js `transpilePackages: ["ui-fired"]`,
with `tsconfig` path aliases mapping the `@ui-fired/*` specifiers into the installed
git-dependency tree — the repo package itself is still named `ui-fired`).

## Development

```sh
npm install
npm run typecheck   # tsc --noEmit across core + react + catalog
npm test            # core + react vitest suites
npm run md-to-json  # regenerate the prompt-fragment JSON mirrors from packages/core/src/prompt/md/*.md
```

> Package naming and the public API surface are being finalized.
