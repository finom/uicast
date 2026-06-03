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
  the confirm / edit-mode UI. Depends on `core`; `react` / `react-dom` are peer
  deps. See [`packages/core/docs/REACT.md`](./packages/core/docs/REACT.md).
- **`packages/catalog`** — the component catalog. Component def/renderer pairs,
  the underlying shadcn/Radix UI primitives, the `componentDefs` / `componentRenderers`
  registries, and the example element arrays. Depends on `core` + `react`.

## Consuming

This is a workspace of three scoped packages — `@ui-fired/core` (the agnostic
engine), `@ui-fired/react` (the React binding), and `@ui-fired/catalog` (the
components) — living in one repo. Import agnostic symbols from the
`@ui-fired/core` barrel, React symbols from `@ui-fired/react`, or reach any
module directly via a subpath:

```ts
import { createProxyScope } from "@ui-fired/core";
import { RecursiveRenderer } from "@ui-fired/react";
import { componentRenderers } from "@ui-fired/catalog/render/renderers";
```

A consumer bundles the raw TypeScript source (e.g. Next.js `transpilePackages: ["ui-fired"]`,
with `tsconfig` path aliases mapping the `@ui-fired/*` specifiers into the installed
git-dependency tree — the repo package itself is still named `ui-fired`).

## Development

```sh
npm install
npm run typecheck   # tsc --noEmit across core + react + catalog
npm test            # core + react vitest suites
npm run md-to-json  # regenerate INSTRUCTIONS.json from its .md sibling
```

> Package naming and the public API surface are being finalized.
