# ui-fired

LLM-generated UIs rendered from JSONLines, composed from a pre-built component
library, and delivered as a normal JS/HTML/CSS page with no build or deployment
step per generation.

## Packages

- **`packages/core`** — the runtime engine. Catalog-agnostic. JSONLines render
  engine, sandboxed micro-expression evaluator, reactive Proxy-based state store,
  chunk-protocol spec, and the prompt-protocol primitives. See
  [`packages/core/docs/DSL.md`](./packages/core/docs/DSL.md) and
  [`packages/core/docs/STATE.md`](./packages/core/docs/STATE.md).
- **`packages/catalog`** — the component catalog. Component def/renderer pairs,
  the underlying shadcn/Radix UI primitives, the `componentDefs` / `componentRenderers`
  registries, and the example chunk arrays. Depends on `core`.

## Consuming

This is a workspace of two scoped packages — `@ui-fired/core` (the engine) and
`@ui-fired/catalog` (the components) — living in one repo. Import the engine's
public surface from the `@ui-fired/core` barrel, or reach any module directly
via a subpath:

```ts
import { createProxyScope } from "@ui-fired/core";
import { RecursiveRenderer } from "@ui-fired/core/render/RecursiveRenderer";
import { componentRenderers } from "@ui-fired/catalog/render/renderers";
```

A consumer bundles the raw TypeScript source (e.g. Next.js `transpilePackages: ["ui-fired"]`,
with `tsconfig` path aliases mapping the `@ui-fired/*` specifiers into the installed
git-dependency tree — the repo package itself is still named `ui-fired`).

## Development

```sh
npm install
npm run typecheck   # tsc --noEmit across core + catalog
npm test            # core's vitest suite
npm run md-to-json  # regenerate INSTRUCTIONS.json from its .md sibling
```

> Extracted from the appcast monorepo. Package naming and the public API surface
> are being finalized.
