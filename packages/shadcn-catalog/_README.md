# @uicast/shadcn-catalog

The component catalog for **uicast**: 128 definition/implementation pairs over [shadcn/ui](https://ui.shadcn.com/) and Radix.

A **definition** is what the model reads — the component's name, what it is for, and its props as a schema. An **implementation** is the React component the renderer runs. Register both and a generated document can name any component in the catalog. Pairs live one directory per component under `src/uicast-catalog/`; copy that layout for your own design system.

## Install

```sh
npm install @uicast/shadcn-catalog@beta @uicast/core@beta @uicast/react@beta @uicast/expr@beta
```

```ts
import * as catalogDefs from "@uicast/shadcn-catalog/all/defs";
import * as catalogImpls from "@uicast/shadcn-catalog/all/impls";
```

Each module exports its components by name and nothing else. `Object.values(catalogDefs)` goes to `getComponentsPartialPrompt`, `Object.values(catalogImpls)` to `<RendererProvider>`. They are separate entry points because the prompt is usually built on the server and the implementations only ship to the browser.

For a smaller prompt, take some groups instead — `layout`, `content`, `data`, `charts`, `forms`, `navigation`, `overlays` — or `essential`: 30 components, about a quarter of the prompt text. See [Essentials](#essentials).

## Entry points

| Import | What it is |
| --- | --- |
| `@uicast/shadcn-catalog/all/defs` | Every component's definition, for the prompt. |
| `@uicast/shadcn-catalog/all/impls` | Every component's React implementation, for the renderer. |
| `@uicast/shadcn-catalog/<group>/defs`, `/<group>/impls` | One group: `layout`, `content`, `data`, `charts`, `forms`, `navigation` or `overlays`. |
| `@uicast/shadcn-catalog/essential/defs`, `/essential/impls` | The 30 essential components. |
| `@uicast/shadcn-catalog/events` | The shared event schemas a definition's `callbacks` reuse. |
| `@uicast/shadcn-catalog` | `ConfirmModal` and `RenderError` — the renderer's confirm and error slots. `DocumentSkeleton` — a document's shape before it renders. |
| `@uicast/shadcn-catalog/ui/*` | The underlying shadcn components, if you need one directly. |

## Essentials

The full catalog is 87,000 characters of prompt. Most generated pages use a fraction of it, and a model choosing between 128 components spends attention on the choice. `essential/defs` and `essential/impls` hold a curated 30, at about a quarter the prompt text:

| Group | Components |
| --- | --- |
| `layout` | `Card` `FlexRow` `FlexCol` `Grid` |
| `content` | `Heading` `Typography` `Badge` `Stat` `Alert` `EmptyState` `DescriptionList` |
| `data` | `Table` `TableHeader` `TableBody` `TableRow` `TableHead` `TableCell` |
| `charts` | `BarChart` `LineChart` `PieChart` |
| `forms` | `Input` `NumberInput` `Select` `Checkbox` `Switch` `SearchInput` `Button` `IconButton` |
| `navigation` | `Pagination` |
| `overlays` | `Modal` |

Swapping is one import path. Add your own with `[...Object.values(catalogDefs), MyDef]`.

## Map tiles

`LocationMap` draws raster map tiles from OpenStreetMap's tile server, whose [usage policy](https://operations.osmfoundation.org/policies/tiles/) forbids heavy use without permission, and credits them in the corner. To use another tile server, copy `src/uicast-catalog/location-map/` into your own catalog and change the tile URL.

The tile URL comes from the implementation, not the document, so the renderer's `urlPolicy` does not check it; a Content-Security-Policy needs the tile host in `img-src`. The document sets the center and zoom, so the tile server sees which area a page shows.

## Document skeleton

`<DocumentSkeleton entries>` draws the shape of a document from the entries alone: the tree from `children`, real text wherever a prop is a literal, a shimmer wherever a prop is an expression.

It evaluates nothing — no expressions, no host functions, no scopes — so it runs anywhere the entries are, including a server render, while the client tree boots. The real render replaces it, and because nothing about it is load-bearing, nothing has to match.

```tsx
{mounted ? <EntriesRenderer entries={entries} /> : <DocumentSkeleton entries={entries} />}
```

Implementations play no part in it. Components that occupy area (cards, tables, charts, stats, grids) draw at their own shape; anything else falls back to a stack when it has children and a bar when it does not.

## Styles

The catalog ships its own stylesheet, so there is no Tailwind config to write:

```css
/* Optional — preflight and the shadcn palette, if you never ran `shadcn init`. */
@import "@uicast/shadcn-catalog/theme.css";
@import "@uicast/shadcn-catalog/catalog.css";
```

Every rule uses a CSS variable (`background-color: var(--card)`), so your own theme restyles the catalog the way it restyles your components.

## Documentation

[github.com/finom/uicast](https://github.com/finom/uicast) — the [component definition](https://github.com/finom/uicast/blob/main/packages/docs/src/app/%28docs%29/def/page.mdx) and [implementation](https://github.com/finom/uicast/blob/main/packages/docs/src/app/%28docs%29/react/page.mdx) pages cover writing your own pairs.

## License

[MIT](../../LICENSE)
