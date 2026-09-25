# @uicast/shadcn-catalog

[![npm](https://img.shields.io/npm/v/@uicast/shadcn-catalog)](https://www.npmjs.com/package/@uicast/shadcn-catalog)

Part of [**uicast**](https://github.com/finom/uicast), the expression-driven generative UI framework.

A reference component catalog for **uicast**: 128 definition/implementation pairs over [shadcn/ui](https://ui.shadcn.com/) and Radix. Register all of it or some groups, or copy its layout for your own design system: one directory per component under [`src/uicast-catalog`](https://github.com/finom/uicast/tree/main/packages/shadcn-catalog/src/uicast-catalog), with a `def.ts` and an `impl.tsx`.

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

Every rule reads a CSS variable (`background-color: var(--card)`), so your theme restyles the catalog too.

## Groups

The whole catalog is about 89,000 characters of prompt. A group is smaller:

| Group | Size | What is in it |
| --- | --- | --- |
| `essential` | 30 | Common components from every group, below. About 21,000 characters. |
| `layout` | 17 | Card, grid, flex row and column, tabs, accordion. |
| `content` | 35 | Heading, typography, badge, avatar, timeline, alert, map. |
| `data` | 11 | Table, data grid, virtual list, kanban board, org chart. |
| `charts` | 16 | Bar, line, pie, area, scatter, funnel, sankey. |
| `forms` | 35 | Field, input, select, date picker, file upload, button. |
| `navigation` | 7 | Sidebar, navigation menu, command menu, breadcrumb, pagination. |
| `overlays` | 7 | Modal, confirm dialog, drawer, popover, tooltip, dropdown menu. |

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
| `content` | `Heading` `Typography` `Badge` `Stat` `Alert` `EmptyState` `DescriptionList` |
| `data` | `Table` `TableHeader` `TableBody` `TableRow` `TableHead` `TableCell` |
| `charts` | `BarChart` `LineChart` `PieChart` |
| `forms` | `Input` `NumberInput` `Select` `Checkbox` `Switch` `SearchInput` `Button` `IconButton` |
| `navigation` | `Pagination` |
| `overlays` | `Modal` |

## Entry points

| Import | What it holds |
| --- | --- |
| `@uicast/shadcn-catalog/<group>/defs` | The group's definitions, for the prompt. `<group>` is `all`, `essential` or a group above. |
| `@uicast/shadcn-catalog/<group>/impls` | The matching implementations, for the renderer. |
| `@uicast/shadcn-catalog` | `ConfirmModal` and `RenderError`, for the renderer's `fallbackComponents`. |
| `@uicast/shadcn-catalog/events` | `mouseEventSchema` and `keyboardEventSchema`, payloads the catalog's callbacks share. |
| `@uicast/shadcn-catalog/ui/*` | The 35 underlying shadcn components, such as `/ui/button` and `/ui/skeleton`. |
| `@uicast/shadcn-catalog/catalog.css` | Every utility the components use. No palette. |
| `@uicast/shadcn-catalog/theme.css` | Optional: preflight and the shadcn palette. |

## Map tiles

`LocationMap` loads map tiles from OpenStreetMap's tile server, whose [usage policy](https://operations.osmfoundation.org/policies/tiles/) forbids heavy use without permission. To use another tile server, copy `src/uicast-catalog/location-map/` into your own catalog and change the tile URL.

The tile URL comes from the implementation, not the document, so `urlPolicy` does not check it; a Content-Security-Policy needs the tile host in `img-src`. The document sets the center and zoom, so the tile server sees which area a page shows.

## Documentation

[Reference catalog](https://uicast.dev/react/reference-catalog) · [Component definition](https://uicast.dev/def) · [Component implementation](https://uicast.dev/react)

## License

[MIT](https://github.com/finom/uicast/blob/main/LICENSE) © [Andrey Gubanov](https://github.com/finom)
