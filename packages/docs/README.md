# @ui-fired/docs

The documentation site for **ui-fired**. It also hosts the interactive
**live demo**.

## TODO Docs Structure

- DSL
  - Counter (main example)
  - Hidden
  - Seed
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

## Run

From the monorepo root:

```sh
npm install
npm run dev -w @ui-fired/docs      # http://localhost:3000 — docs at /, demo at /demo
npm run build -w @ui-fired/docs    # production build
npm run typecheck -w @ui-fired/docs
```
