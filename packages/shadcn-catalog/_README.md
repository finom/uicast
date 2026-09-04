# @uicast/shadcn-catalog

The component catalog for **uicast**: 150 definition/implementation pairs over [shadcn/ui](https://ui.shadcn.com/) and Radix.

A **definition** is what the model reads — the component's name, what it is for, and its props as a schema. An **implementation** is the React component the renderer runs. Register both and a generated document can name any component in the catalog. Pairs live one directory per component under `src/uicast-catalog/`; copy that layout for your own design system.

## Install

```sh
npm install @uicast/shadcn-catalog@beta @uicast/core@beta @uicast/react@beta @uicast/expr@beta
```

```ts
import { allDefinitions } from "@uicast/shadcn-catalog/defs";
import { allImplementations } from "@uicast/shadcn-catalog/impls";
```

`allDefinitions` goes to `getComponentsPartialPrompt`, `allImplementations` to `<RendererProvider>`. They are separate entry points because the prompt is usually built on the server and the implementations only ship to the browser.

## Entry points

| Import | What it is |
| --- | --- |
| `@uicast/shadcn-catalog/defs` | `allDefinitions` — every component's definition, for the prompt. |
| `@uicast/shadcn-catalog/impls` | `allImplementations` — every component's React implementation, for the renderer. |
| `@uicast/shadcn-catalog/events` | The shared event schemas a definition's `callbacks` reuse. |
| `@uicast/shadcn-catalog/fallback-components` | `ConfirmModal` — the renderer's confirm slot. |
| `@uicast/shadcn-catalog/document-skeleton` | `DocumentSkeleton` — a document's shape before it renders. |
| `@uicast/shadcn-catalog/ui/*` | The underlying shadcn components, if you need one directly. |

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
