# @uicast/shadcn-catalog

The component catalog for **uicast**: 128 definition/implementation pairs over [shadcn/ui](https://ui.shadcn.com/) and Radix.

A **definition** is what the model reads — the component's name, what it is for, and its props as a schema. An **implementation** is the React component the renderer runs. Register both and a generated document can name any component in the catalog. Pairs live one directory per component under `src/uicast-catalog/`; copy that layout for your own design system.

## Install

```sh
npm install @uicast/shadcn-catalog@beta @uicast/core@beta @uicast/react@beta @uicast/expr@beta
```

```ts
import { defs } from "@uicast/shadcn-catalog/all-defs";
import { impls } from "@uicast/shadcn-catalog/all-impls";
```

`defs` goes to `getComponentsPartialPrompt`, `impls` to `<RendererProvider>`. They are separate entry points because the prompt is usually built on the server and the implementations only ship to the browser.

For a smaller prompt, import the same two names from `essential-defs` and `essential-impls` instead — 30 components, about a quarter of the prompt text. See [Essentials](#essentials).

## Entry points

| Import | What it is |
| --- | --- |
| `@uicast/shadcn-catalog/all-defs` | `defs` — every component's definition, for the prompt. |
| `@uicast/shadcn-catalog/all-impls` | `impls` — every component's React implementation, for the renderer. `createLocationMapImplementation` — see [Map tiles](#map-tiles). |
| `@uicast/shadcn-catalog/essential-defs` | `defs` — the 30 essential definitions. |
| `@uicast/shadcn-catalog/essential-impls` | `impls` — their implementations. |
| `@uicast/shadcn-catalog/events` | The shared event schemas a definition's `callbacks` reuse. |
| `@uicast/shadcn-catalog/fallback-components` | `ConfirmModal` — the renderer's confirm slot. |
| `@uicast/shadcn-catalog/document-skeleton` | `DocumentSkeleton` — a document's shape before it renders. |
| `@uicast/shadcn-catalog/ui/*` | The underlying shadcn components, if you need one directly. |

## Essentials

The full catalog is 87,000 characters of prompt. Most generated pages use a fraction of it, and a model choosing between 128 components spends attention on the choice. `essential-defs` and `essential-impls` export the same `defs` and `impls` names from a curated 30, at about a quarter the prompt text:

| Group | Components |
| --- | --- |
| Layout | `Card` `FlexRow` `FlexCol` `Grid` |
| Text | `Heading` `Typography` `Badge` `Stat` |
| Table | `Table` `TableHeader` `TableBody` `TableRow` `TableHead` `TableCell` |
| Form | `Input` `NumberInput` `Select` `Checkbox` `Switch` `SearchInput` `Button` `IconButton` |
| Charts | `BarChart` `LineChart` `PieChart` |
| Other | `Alert` `EmptyState` `Modal` `DescriptionList` `Pagination` |

Swapping between them is one import — the exported names are the same. Add to either with `[...defs, MyDef]`.

## Map tiles

`LocationMap` draws raster map tiles and credits their source in the corner. By default they come from OpenStreetMap's tile server, whose [usage policy](https://operations.osmfoundation.org/policies/tiles/) forbids heavy use without permission. To use another tile server, build the implementation yourself and swap it in:

```ts
import { createLocationMapImplementation, impls } from "@uicast/shadcn-catalog/all-impls";

const implementations = [
  ...impls.filter((impl) => impl.def.name !== "LocationMap"),
  createLocationMapImplementation({
    tileUrl: "https://tiles.example.com/{z}/{x}/{y}.png",
    attribution: "© Example Maps, © OpenStreetMap contributors",
  }),
];
```

The tile URL comes from your code, not the document, so the renderer's `urlPolicy` does not check it; a Content-Security-Policy needs the tile host in `img-src`. The document sets the center and zoom, so the tile server sees which area a page shows.

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

[github.com/finom/uicast](https://github.com/finom/uicast) — the [component definition](https://github.com/finom/uicast/blob/main/packages/docs/src/app/%28docs%29/def/page.mdx) and [implementation](https://github.com/finom/uicast/blob/main/packages/docs/src/app/%28docs%29/react/impl/page.mdx) pages cover writing your own pairs.

## License

[MIT](../../LICENSE)
