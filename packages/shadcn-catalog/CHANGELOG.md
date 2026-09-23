# Changelog

All notable changes to this package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `@uicast/shadcn-catalog/essential-defs` and `/essential-impls`: 30 of the 128 components — layout, text, the table family, the common form controls, three charts, and the few states a page needs. They export the same `defs` and `impls` names as the full registries, so switching is one import. The prompt they render is about a quarter of the whole catalog's.
- `PieChart.centerLabel`: text in the hole of a donut chart, such as a total. Ignored unless `donut` is true.
- `@uicast/shadcn-catalog/document-skeleton`: `<DocumentSkeleton entries implementations>` draws a document's shape before the renderer boots. It walks the entries and draws each element with that element's own `placeholder`, passing the drawn children down; a list is repeated a few times. It evaluates nothing and reads no props, so it renders on the server while the client tree mounts, and the real render replaces it.
- A `placeholder` on 79 implementations, so `DocumentSkeleton` draws them. A placeholder given children renders its own tag; given none it fills the slot inside a real element, which is how the renderer calls it.
- `Pagination` works without a page count: `totalPages` is optional, and without it the control renders Previous, the pages up to the current one and Next, with `hasNext` (default `true`) gating Next — for a function that returns a page and no total. An ellipsis marks pages elided on either side.
- `RelativeTime` updates as time passes: each second under a minute away, each minute under an hour, else each hour. It rendered once before.
- `TableHead.width`: a named column width. A column holding inputs or buttons has no intrinsic width, and an auto-layout table would give it almost none.
- `createLocationMapImplementation({ tileUrl, attribution })` in `/all-impls` builds `LocationMap` over another tile server: `tileUrl` holds `{z}`, `{x}` and `{y}`, and `attribution` is drawn in the map's corner. The registry's `LocationMapImpl` uses OpenStreetMap.

### Changed

- **Breaking: 21 redundant components are gone**, leaving 129. Each was covered by one that remains: `Stack` (FlexRow/FlexCol), `Sheet` (Drawer, identical props), `Spacer` (the gap props), `Label` (Typography, or FieldLabel in a form), `DonutChart` (PieChart's `donut`), `AlertDialog` (ConfirmDialog), `SegmentedControl` (ToggleGroup), `PasswordInput` (Input's `password` type), `DateRangePicker` (two DatePickers), `FlowDiagram` (Stepper), `Toolbar` (FlexRow), `FormSection` (Card), `PageHeader` (Heading + Typography + Breadcrumb), `StatusIndicator` (Badge), `InlineMessage` (Alert), `CircularProgress` (GaugeChart or ProgressBar), `Menubar` (NavigationMenu), `ContextMenu` (DropdownMenu), `Toggle` (Switch or ToggleGroup). `SortableList` and `Barcode` went because neither did what its name said — the drag handles never reordered and the barcode was never scannable.
- **Breaking: the registry entry points are `@uicast/shadcn-catalog/all-defs` and `/all-impls`, exporting `defs` and `impls`.** Was `/defs` and `/impls` exporting `allDefinitions` and `allImplementations`. Every definition and implementation is still exported by name from the same module.
- Pairs moved from `src/uicast/` to `src/uicast-catalog/`. Internal layout — the package's entry points are unchanged.
- Table containers and `Card` set `content-visibility: auto` with an intrinsic size, so off-screen tables and cards skip layout and paint. On a large page, resize and scroll no longer lay out every section.
- **Breaking:** `render(props, context)` — the second argument replaces `generatedKey`. `context.entry.key` is the entry's key (`data-key` on every root node), `context.loading` the entry's `loading` flag, `context.scopes` the scopes it reads.
- `Table`, `Card`, `Stat`, `DescriptionList` and every chart render busy while `loading` is true: the content stays, dimmed and pulsing, with `aria-busy` set.
- **Breaking: `Icon` and every `icon` prop take a name from a fixed set.** The catalog imports ~96 named icons instead of the whole lucide namespace, so a consumer bundle carries 8.6 KB gzipped instead of 175 KB. The names appear once in the prompt as the shared type `IconName`. `Icon.color` is a theme vocabulary (`default`, `muted`, `primary`, `destructive`, `success`, `warning`), not a Tailwind class fragment.
- **Breaking: no prop takes free-form text where the value comes from a fixed set.** Chart colours are palette names (`ChartColor`), sizes are named (`Width`, `Height`, `ColumnWidth`) or pixel counts, code languages, currencies, locales, calling codes, file kinds, keyboard keys and filter operators are enums, and dates and times are `z.iso.date()` / `z.iso.time()` / `z.iso.datetime()`.
- **Breaking: `TreeView.items` and `OrgChart.root` nest to any depth.** Both were unrolled two levels deep and then `z.any()`. `FileUpload.accept` is now a list of kinds, not a comma-joined string. `Kbd.keys` and every menu `shortcut` are key-name arrays. `Tag.onRemove` sends `null`, like every other payload-free callback.
- Numeric props carry their bounds: percentages are 0-100 (`ProgressBar.value` runs from 0 to `max`), indices and counts are non-negative integers, pixel dimensions are positive integers, and map coordinates are within their real ranges.
- Callback payloads use `z.strictObject`, matching props.
- `ScatterChart.nameKey` is `name`, a string: the series name in the tooltip. It was typed as a colour.
- `SignaturePad.onEnd` reports `isEmpty` truthfully and fires only after a stroke.
- **Breaking: four components are renamed so that no component shares a name with a JavaScript or browser global:** `Map` is `LocationMap`, `Image` is `Picture`, `Text` is `Typography`, `Highlight` is `HighlightedText`. Their exports follow (`TypographyDef`, `TypographyImpl`, …). A catalog test fails on any such name.
- **Breaking: `LocationMap` draws map tiles itself.** 256-px raster tiles fill the `width` × `height` box, placed by the Web Mercator formula from `center` and `zoom`, and pins are placed by the same formula. It was an openstreetmap.org iframe over a fixed ±0.05° box, with pins placed by a different rule that missed their spot. `zoom` runs from 0 to 19 and changes what the map shows; `width` and `height` are at most 2048. Pins are buttons named by their label, which shows on hover or focus. The tiles come from OpenStreetMap unless the host sets another server, and their credit is always shown.
- **Breaking: `Link` renders an `<a href>`.** A click opens `href`, and `external` opens it in a new tab (`target="_blank" rel="noopener noreferrer"`). `href` is required; `onClick` and `disabled` are gone. A link navigates; an action is a `Button`.
- Descriptions match what renders: `Popover` (the trigger is a button labelled `triggerLabel`; every child renders in the panel), `PhoneInput.value` (without the calling code), `NotificationBadge.count` (0 hides the badge unless `showZero`), `HighlightedText.color` (four named colours, no CSS colour), `PieChart.colors` and `FunnelChart.colors` (one per slice or stage), `Sidebar` (collapses to icons; its sections do not collapse), `TreemapChart` (one rectangle per item, not nested), `TruncatedText` (a Show more toggle, no tooltip), `WaterfallChart.data[].isTotal` (the running total; its value is ignored), `ScrollArea.orientation` (vertical scrolling is always on).

### Removed

- Props and callbacks nothing implemented: `Banner.onAction`, `CodeEditor.language`, `CurrencyInput.min` and `max`, `Field.disabled`, `FieldLabel.htmlFor`, `TreemapChart.data[].color`.
- `ui/context-menu` and `ui/menubar`: only the removed `ContextMenu` and `Menubar` used them.
- **Breaking: `MarkdownViewer`.** Its markdown loaded images from any site and linked anywhere, past the renderer's `urlPolicy`. The catalog no longer depends on `streamdown`.

### Fixed

- `PieChart`, `FunnelChart`, `ComboChart` and `GanttChart` used a colour's name as the SVG fill; they look it up in the palette now, as the other charts do.
- `SearchInput.onSubmit` sends the input's live value, not the `value` prop it was last given.
- `NumberInput` keeps a minimum width (`5rem`), so it no longer collapses to nothing inside a table cell.
- `AccordionItem` content that loads after opening (rows fetched on open) was clipped at the height measured on open; the content wrapper no longer has a fixed height.
- `Slider` keeps a minimum width (`12rem`); in a wrapping flex row its track collapsed to the thumb alone.
- `DonutChart` fits its box: the ring is clamped to the chart height, the legend renders below the chart in its own space instead of over the ring, and the center label is centered on the ring, not on the box the legend shared.
- `AccordionItem` under a `single` Accordion coordinates by a per-instance id, not the entry key: items rendered by `each` share one entry key, so opening one opened them all.
- `Checkbox`, `Radio` and `Switch` rendered by `each`: a click on any item's label toggled the first item's control. Their ids came from the entry key, which list items share.
- `DataGrid`'s header stays in view while its rows scroll.
- `DatePicker` and `TimePicker` no longer report a cleared or half-typed value, an empty string the payload schema refused.
- `ColorPicker`'s text field reports only a complete hex colour; every keystroke before that failed the payload schema.
- `BubbleChart.xLabel` and `yLabel` name the values in the tooltip; they were shown nowhere.
- `KanbanBoard`: cancelling a drag puts a card moved to another column back; it stayed there, and `onCardMove` never fired.
- `FilterBuilder`: choosing another field resets the operator and the value.
- `List` with `ordered: true` draws numbers; it drew bullets unless `styleType` said otherwise.
- `NavigationMenu` items without sub-items take keyboard focus.
- `Link`: `size: "lg"` enlarges the text, and `underline: "none"` no longer underlines on hover.
- `FileUpload` shows the not-allowed cursor when disabled.
- `FunnelChart` labels use the text colour; they were black, unreadable on a dark theme.
- `ResizablePanel` sizes are percentages, as the definition says: react-resizable-panels 4 read the numbers as pixels.
- `SignaturePad` draws with touch and pen, not only the mouse.
- `TreemapChart` draws every item; rectangles narrower than 30 px or shorter than 20 px were dropped.
- `WaterfallChart`'s tooltip shows a decrease as a negative value.
- `ProgressBar.max` must be positive; 0 gave the bar a NaN width.
- `MultiSelect` is rebuilt on Popover and Command. A click anywhere on an option toggles it, a click outside closes the list, and the list takes the arrow keys and Enter. The trigger nested a button in a button, a React hydration warning; only the checkbox toggled, and nothing closed the list but the trigger.
- `Carousel` with `orientation: "vertical"` showed every slide at once and stepped past them. Slides now share one cell, as tall as the tallest, and the vertical arrows sit at the top and bottom. `loop` with no slides no longer sets the index to NaN, and the arrow buttons have accessible names.
- `Combobox` and `CommandMenu` shaded every option, not just the highlighted one: cmdk sets `data-selected="false"` on the others, and the style matched the attribute's presence.
- Descriptions no longer claim what the implementation does not do: syntax highlighting in `CodeBlock`, a ⌘K shortcut in `CommandMenu`, formatted amounts in `CurrencyInput`, info, success and warning colours in `Alert`, a blue confirm button in `ConfirmDialog`, a shadow on `Card`.

### Changed

- Every schema in the catalog is `z.strictObject` again: an invented prop fails the element into its error slot instead of being silently dropped. The expression language got strict; the catalog follows.

### Changed

- URL-bearing props are now declared as URLs (`format: "uri-reference"`) so the renderer's `urlPolicy` validates them: `Picture.src`, `Avatar.src`, `AvatarGroup.avatars[].src`, `VideoPlayer.src`, `VideoPlayer.poster`, `OrgChart.nodes[].avatar`, `ChatThread.messages[].avatar`, and `Link.href`. A cross-origin URL in one of these is refused by default — add the host to the renderer's `urlPolicy` if it is trusted.

### Added

- Initial public beta of the component catalog: definition/implementation pairs over shadcn/Radix, the `allDefinitions` / `allImplementations` registries, and the common event schemas.
