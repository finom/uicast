<h1 align="center">@uicast/shadcn-catalog</h1>
<p align="center">Part of <a href="https://github.com/finom/uicast"><strong>uicast</strong></a>, the expression-driven generative UI framework.</p>
<p align="center"><a href="https://uicast.dev">uicast.dev</a></p>
<p align="center"><a href="https://www.npmjs.com/package/@uicast/shadcn-catalog"><img src="https://img.shields.io/npm/v/@uicast/shadcn-catalog.svg?color=brightgreen" alt="npm version"></a> <a href="https://scorecard.dev/viewer/?uri=github.com/finom/uicast"><img src="https://api.scorecard.dev/projects/github.com/finom/uicast/badge" alt="OpenSSF Scorecard"></a> <a href="https://www.bestpractices.dev/projects/15106"><img src="https://www.bestpractices.dev/projects/15106/badge" alt="OpenSSF Best Practices"></a> <a href="https://github.com/finom/uicast/actions/workflows/ci.yml"><img src="https://github.com/finom/uicast/actions/workflows/ci.yml/badge.svg" alt="CI"></a></p>

A reference component catalog for **uicast**: 106 definition/implementation pairs over [shadcn/ui](https://ui.shadcn.com/) and Radix. Register all of it or some groups, or copy its layout for your own design system: one directory per component under [`src/uicast-catalog`](https://github.com/finom/uicast/tree/main/packages/shadcn-catalog/src/uicast-catalog), with a `def.ts` and an `impl.tsx`. The [gallery](https://uicast.dev/shadcn-catalog-gallery) renders every component.

```sh
npm install @uicast/shadcn-catalog@beta @uicast/core@beta @uicast/react@beta @uicast/expr@beta
```

Needs React 19.2.

## Use it

The definitions go to the prompt, the implementations to the renderer:

```ts
import { getComponentsPartialPrompt } from "@uicast/core/prompt";
import { defs } from "@uicast/shadcn-catalog/all/defs";

getComponentsPartialPrompt({ definitions: defs });
```

```tsx
import { impls } from "@uicast/shadcn-catalog/all/impls";

<RendererProvider implementations={impls} evaluator={evaluator}>
  <EntriesRenderer entries={entries} />
</RendererProvider>;
```

The `defs` modules import no React, so the prompt can be built on the server. Each module also exports its components by name (`CardDef`, `CardImpl`, …). To add your own, extend both arrays: `[...defs, MyDef]` and `[...impls, MyImpl]`.

## Styles

The catalog ships its own stylesheet, so there is no Tailwind config to write:

```css
/* Optional: preflight and the shadcn palette, if you never ran `shadcn init`. */
@import "@uicast/shadcn-catalog/theme.css";
@import "@uicast/shadcn-catalog/catalog.css";
```

The catalog reads your theme's CSS variables (`background-color: var(--card)`), so your theme restyles it too, status colors included: `--success`, `--warning`, `--info` and `--destructive`. `catalog.css` has defaults for the first three.

## Groups

A group puts only its components into the prompt:

| Group | Size | Tokens | What is in it |
| --- | --- | --- | --- |
| `all` | 106 | 18,900 | Every component. |
| `essential` | 29 | 5,300 | Common components from every group, below. |
| `layout` | 16 | 2,200 | Card, grid, flex row and column, tabs, accordion. |
| `content` | 29 | 6,100 | Heading, typography, badge, avatar, timeline, alert, map. |
| `data` | 10 | 1,600 | Table, data grid, virtual list, kanban board. |
| `charts` | 12 | 2,400 | Bar, line, pie, scatter, funnel, heatmap. |
| `forms` | 27 | 5,400 | Form, field, input, select, date picker, button. |
| `navigation` | 7 | 2,300 | Sidebar, navigation menu, command menu, breadcrumb, pagination. |
| `overlays` | 5 | 900 | Modal, popover, tooltip, dropdown menu. |

Tokens are rounded and counted with OpenAI's o200k tokenizer (GPT-4o and later). Other models count differently.

Take several groups by spreading them, the same way on both sides:

```ts
import * as layout from "@uicast/shadcn-catalog/layout/defs";
import * as charts from "@uicast/shadcn-catalog/charts/defs";

const definitions = [...layout.defs, ...charts.defs];
```

The essentials:

| Group | Components |
| --- | --- |
| `layout` | `Card` `FlexRow` `FlexCol` `Grid` |
| `content` | `Heading` `Typography` `Badge` `Stat` `Alert` `EmptyState` |
| `data` | `Table` `TableHeader` `TableBody` `TableRow` `TableHead` `TableCell` |
| `charts` | `BarChart` `LineChart` |
| `forms` | `Form` `Field` `FieldLabel` `Input` `NumberInput` `Select` `Checkbox` `Switch` `Button` |
| `navigation` | `Pagination` |
| `overlays` | `Modal` |

## Entry points

| Import | What it holds |
| --- | --- |
| `@uicast/shadcn-catalog/<group>/defs` | The group's definitions, for the prompt. `<group>` is `all`, `essential` or a group above. |
| `@uicast/shadcn-catalog/<group>/impls` | The matching implementations, for the renderer. |
| `@uicast/shadcn-catalog` | `ConfirmModal` and `RenderError`, for the renderer's `fallbackComponents`. |
| `@uicast/shadcn-catalog/events` | `mouseEventSchema` and `keyboardEventSchema`, payloads the catalog's callbacks share. |
| `@uicast/shadcn-catalog/ui/*` | The 37 underlying components (shadcn/ui, and Kibo UI's kanban), such as `/ui/button` and `/ui/skeleton`. |
| `@uicast/shadcn-catalog/catalog.css` | Every utility the components use. |
| `@uicast/shadcn-catalog/theme.css` | Optional: preflight and the shadcn palette. |

## Map tiles

`LocationMap` loads map tiles from OpenStreetMap's tile server, whose [usage policy](https://operations.osmfoundation.org/policies/tiles/) forbids heavy use without permission. To use another tile server, copy `src/uicast-catalog/location-map/` into your own catalog and change the tile URL.

The tile URL comes from the implementation, not the document, so `urlPolicy` does not check it; a Content-Security-Policy needs the tile host in `img-src`. The document sets the center and zoom, so the tile server sees which area a page shows.

## Documentation

[Reference catalog](https://uicast.dev/react/reference-catalog) · [Gallery](https://uicast.dev/shadcn-catalog-gallery) · [Component definition](https://uicast.dev/def) · [Component implementation](https://uicast.dev/react)

## License

[MIT](https://github.com/finom/uicast/blob/main/LICENSE) © [Andrey Gubanov](https://github.com/finom)
