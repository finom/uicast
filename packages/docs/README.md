# @ui-fired/docs

The documentation site for **ui-fired**, built with [Nextra](https://nextra.site)
(Next.js App Router + MDX). It also hosts the interactive **live demo**.

## Structure

| Path | What |
|---|---|
| `src/app/(docs)/**/page.mdx` | The documentation pages — plain App Router routes, rendered by the Nextra docs theme. |
| `src/app/_meta.tsx` | Sidebar order + labels. Lives at the app root (route groups are stripped from page routes but not from `_meta` paths, so a meta inside `(docs)` wouldn't line up). |
| `src/app/(docs)/layout.tsx` | The Nextra theme `<Layout>` (navbar + sidebar + footer), scoped to the docs route group. |
| `src/app/demo/` | The interactive demo at `/demo` — full-bleed, with its own theme provider, outside the docs chrome (hidden from the sidebar via `_meta`). |
| `src/mdx-components.tsx` | Wires MDX elements to the docs-theme components. |
| `src/app/layout.tsx` | Bare root shell shared by the docs pages and the demo. |
| `next.config.ts` | Nextra + `output: 'export'`, plus the monorepo Turbopack fixes (see Build notes). |

## Writing docs

Add a `page.mdx` under `src/app/(docs)/<route>/` and list its segment in
`src/app/_meta.tsx`; it renders at `/<route>` automatically, with the docs-theme
navbar and sidebar. The `(docs)` route group is stripped from the URL, so `index`
in `_meta.tsx` is the `(docs)/page.mdx` home page.

## TODO Docs Structure

- DSL
  - Counter (main example)
  - Hidden
  - Defaults
  - Events
  - Async Functions
- Component Definition
- Component Implementation (React)
- Shadcn Catalog
- State Management
- Value Sources & Expressions
- Back-end Framework: Vovk.ts

## The demo

`/demo` streams a hand-authored JSONLines artifact and reveals it one entry at a
time, rendered by the engine with real catalog components and async data
functions. Data is mock (`@faker-js/faker`) and persisted in the browser via
IndexedDB (Dexie) — fully self-contained, no backend.

## Search

Full-text search is [Pagefind](https://pagefind.app), the same engine Nextra 4's
theme drives. The `postbuild` script indexes the prerendered HTML
(`pagefind --site .next/server/app --output-path out/_pagefind`), so the search box
only returns results against a **production build** — it's inert under `next dev`.
The theme renders the search input automatically and loads `/_pagefind` on focus;
only pages the theme tags with `data-pagefind-body` are indexed, so the full-bleed
`/demo` routes are excluded.

```sh
npm run build -w @ui-fired/docs    # runs postbuild → out/_pagefind
npx serve out                      # try search against the built site
```

## Run

From the monorepo root:

```sh
npm install
npm run dev -w @ui-fired/docs      # http://localhost:3000 — docs at /, demo at /demo (search inert)
npm run build -w @ui-fired/docs    # production build + Pagefind index
npm run typecheck -w @ui-fired/docs
```

## Build notes (Nextra 4.6 + Next 16, npm-workspace monorepo)

The build runs on Turbopack (`next build`/`next dev`, no `--webpack`), same as a
standalone Nextra app such as vovk.dev. Three deliberate choices make it work from
*inside the monorepo* — don't revert them:

- **`next.config.ts` pins `turbopack.root` to the workspace top and overrides the
  MDX import-source alias** (`next-mdx-import-source-file` → `./src/mdx-components.tsx`).
  Nextra aims that alias at Next's `@vercel/turbopack-next/mdx-import-source`
  builtin, which Next 16 resolves against the inferred Turbopack root. In a
  workspace that root is the monorepo top — where no `mdx-components` lives — so
  the alias has to be set by hand (an absolute path is misread as "server
  relative"; use a path relative to the package). A standalone app needs neither.
- **`src/app/_meta.tsx` sits at the app root, not inside `(docs)`.** Nextra strips
  route groups from page routes but not from `_meta` paths, so a meta inside the
  group never associates with its pages. Root-level meta stays aligned; the demo
  is marked `display: 'hidden'` there to keep it out of the sidebar.
- **The root `package.json` pins Nextra's `zod` to `~4.3.6` via `overrides`.**
  The theme's `<Layout>` trips a zod ≥ 4.4 validation change; `@ui-fired/core`
  keeps its own zod 4.4.x. Both coexist — the override is scoped to Nextra only.
