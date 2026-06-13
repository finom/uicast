# @ui-fired/website

A private, in-repo **live reference** for the `@ui-fired` render engine and
component catalog. One page: a hand-authored JSONLines artifact — the kind a
model streams — rendered by the engine with real catalog components and real
async data functions. (This will grow into the official site later.)

## What it shows

Press **Play** and the page reveals the artifact one chunk at a time, simulating
a model emitting JSONLines:

- **Left** — the raw chunks as they stream, one JSON object per line.
- **Right** — the engine rendering those chunks live: an inventory dashboard
  with summary stats, a category chart, and a searchable products table you can
  actually use.

It exercises the pieces that matter:

- **Async `defaults`** — data loads through `<Renderer functions=…>` calls and
  suspends with a placeholder until it resolves.
- **Reactive expressions** — stats, the chart, and the table all derive from one
  `products` array and stay in sync as you add, edit, and delete.
- **Confirm seam** — deleting a row routes through the catalog's confirm modal.
- **Catalog styling** — shadcn components via Tailwind v4 (see the `@source`
  hints in `src/app/globals.css`).

Data is mock (seeded with `@faker-js/faker`) and persisted in the browser via
IndexedDB (Dexie), so it's fully self-contained and offline — no backend.

## Run

From the monorepo root:

```bash
npm install            # links the workspace + installs deps
npm run dev -w @ui-fired/website
```

Then open http://localhost:3000.

```bash
npm run build -w @ui-fired/website      # production build
npm run typecheck -w @ui-fired/website  # tsc --noEmit
```

## Layout

| Path | What |
|---|---|
| `src/app/page.tsx`, `demo-player.tsx` | The page + Play/stream orchestration |
| `src/app/stream-panel.tsx`, `render-canvas.tsx` | Left (JSONLines) / right (rendered app) panes |
| `src/demo/inventory.lines.ts` | The streamed artifact (`ComponentEntry[]`) |
| `src/demo/inventory.prompt.ts` | The illustrative prompt + embedded data sample |
| `src/lib/functions.ts` | The async CRUD functions exposed to expressions |
| `src/lib/db.ts`, `seed.ts` | Dexie store + faker seed |
| `src/app/globals.css` | Tailwind v4 + design tokens + catalog `@source` hints |
