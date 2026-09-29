# Changelog

All notable changes to this package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `@uicast/shadcn-catalog/ui/kanban`: Kibo UI's Kanban (MIT), which `KanbanBoard` renders. It adds the `tunnel-rat` dependency.
- A JSDoc comment with an example on `ConfirmModal`, `RenderError` and the `/events` schemas, shown on hover.
- `@uicast/shadcn-catalog/essential/defs` and `/essential/impls`: 29 of the 107 components — layout, text, the table family, the common form controls, three charts, and the few states a page needs. The prompt they render is about a quarter of the whole catalog's.
- `PieChart.centerLabel`: text in the hole of a donut chart, such as a total. Ignored unless `donut` is true.
- A `skeleton` on 67 implementations, so `DocumentSkeleton` from `@uicast/react` draws them. A skeleton given children renders its own tag; given none it fills the slot inside a real element, which is how the renderer calls it.
- Skeletons draw from `knownProps`. `Grid`, `FlexCol` and `FlexRow` follow the columns, gap, alignment and wrap; `Card` and `Alert` draw the `title` in place of a bar. Without known props they draw as before.
- `Pagination` works without a page count: `totalPages` is optional, and without it the control renders Previous, the pages up to the current one and Next, with `hasNext` (default `true`) gating Next — for a function that returns a page and no total. An ellipsis marks pages elided on either side.
- `TableHead.width`: a named column width. A column holding inputs or buttons has no intrinsic width, and an auto-layout table would give it almost none.
- `EmptyState.icon`: an icon in place of the default folder.
- `Form`: holds the fields and draws its own submit button (`submitText`). On submit the browser checks every field, each `Field` whose control fails shows the browser's message, and the first gets focus. `onSubmit` runs only when all pass, and the button shows a spinner until its steps finish.
- `required` on `Input`, `Textarea`, `CurrencyInput`, `Select` and `Checkbox`. The `FieldLabel` of a required control shows a red asterisk.

### Changed

- `src/components/ui` holds the current shadcn radix-nova registry items, with only their import paths changed. The two local edits moved to implementations: `Table` puts its `content-visibility` on a wrapper, and `DataGrid` passes its max height to the scroll viewport.
- `KanbanBoard` is built on Kibo UI's Kanban. Cards show their borders, and a tag is a tinted chip with a colored dot.
- `Carousel` is built on shadcn's Carousel (Embla). The arrows sit outside the slides instead of over them. It adds the `embla-carousel-react` dependency.
- `Alert` takes child entries below its description, its `title` is optional, and its icon shows the status color. It covers what `Callout` did.
- `EmptyState` shows a folder icon instead of an inbox.
- `Button` is as wide as its label. In a column or a grid cell it stretched to the full width.
- `RadarChart` draws no radius axis; its numbers crossed the plot.
- `Heatmap` runs from `slate` to `blue` by default, light to strong. It ran from blue to violet, and the highest values looked palest.
- **Breaking: eight components merged into the one they duplicated.** `Tag` is `Badge` with `removable` (and `onClick`, `onRemove`). `Banner` is `Alert` with `dismissible` and `icon` (and `onDismiss`). `BubbleChart` is `ScatterChart` with `sizeKey`. `AreaChart` is `LineChart` with `filled` and `stacked`. `ComboChart` is `BarChart` with `lineKeys`, colored after the bars. `RangeSlider` is `Slider` with a `[low, high]` pair as `value`. `Drawer` is `Modal` with `side`. `Combobox` is `Select` with `searchable`, and `Select.onChange` sends the option's `label` too.
- **Breaking: `Button` takes an `icon` and a `tooltip`, and `size` is `sm`, `default` or `lg`.** Without text it is square. `size` sets the height, the text size and the icon size; `"icon"` is gone.
- Descriptions name only their own component and its parts, since a host registers any subset of the catalog. A catalog test fails on a description that names another component. `DataGrid` and `Table` each describe their own use.
- Status colors come from theme variables: `--success`, `--warning`, `--info` and shadcn's `--destructive` replace the fixed Tailwind green, yellow, blue and red. `catalog.css` sets defaults for the first three, light and dark; a theme's own values win. `Rating` stars and `HighlightedText` colors use them too. `DiffViewer` text stays in the foreground color, on a tint of the status color.
- Implementations share three helpers in `src/lib`: `skeletons.tsx` (the bar, stack, row and panel skeletons), `chart-frame.tsx` (the box around every Recharts chart) and `use-mirror.ts` (local state that a prop change resets). Copy them with a component. Rendering is unchanged, except that every chart's box is `position: relative`, as `PieChart`'s was.
- `RenderError` reads the element's key from `error.elementKey`, since `ErrorComponentProps` no longer carries it.
- Depends on zod `~4.6.5` (was `~4.3.6`).
- **Breaking: `RelativeTime` is `DateTime`, and shows any date or time** in the viewer's language and time zone. `value` takes an ISO date-time, an ISO date (shown as that day in every time zone) or a timestamp in milliseconds. `format` is `"date"` (the default), `"time"`, `"datetime"`, `"relative"`, or `Intl.DateTimeFormat` options. A relative time updates as time passes: each second under a minute away, each minute under an hour, else each hour; it rendered once before. The text takes the surrounding style instead of small muted text.
- **Breaking: 21 redundant components are gone.** Each was covered by one that remains: `Stack` (FlexRow/FlexCol), `Sheet` (Modal's `side`), `Spacer` (the gap props), `Label` (Typography, or FieldLabel in a form), `DonutChart` (PieChart's `donut`), `AlertDialog` (a step's `confirm`), `SegmentedControl` (ToggleGroup), `PasswordInput` (Input's `password` type), `DateRangePicker` (two DatePickers), `FlowDiagram` (Stepper), `Toolbar` (FlexRow), `FormSection` (Card), `PageHeader` (Heading + Typography + Breadcrumb), `StatusIndicator` (Badge), `InlineMessage` (Alert), `CircularProgress` (GaugeChart or ProgressBar), `Menubar` (NavigationMenu), `ContextMenu` (DropdownMenu), `Toggle` (Switch or ToggleGroup). `SortableList` and `Barcode` went because neither did what its name said — the drag handles never reordered and the barcode was never scannable.
- **Breaking: the registries are one module per group.** `@uicast/shadcn-catalog/<group>/defs` and `/<group>/impls` for `layout`, `content`, `data`, `charts`, `forms`, `navigation` and `overlays`, and `/all/defs` and `/all/impls` for every group, export each definition and implementation by name, and all of them as one array: `defs` or `impls`. Was `/defs` and `/impls` exporting `allDefinitions` and `allImplementations`.
- **Breaking: `ConfirmModal` and `RenderError` come from the package root, `@uicast/shadcn-catalog`.** Was `/default-components`.
- Pairs moved from `src/uicast/` to `src/uicast-catalog/`. Internal layout — the package's entry points are unchanged.
- Table containers and `Card` set `content-visibility: auto` with an intrinsic size, so off-screen tables and cards skip layout and paint. On a large page, resize and scroll no longer lay out every section.
- **Breaking:** `render(props, context)` — the second argument replaces `generatedKey`. `context.entry.key` is the entry's key (`data-key` on every root node), `context.loading` the entry's `loading` flag, `context.scopes` the scopes it reads.
- `Table`, `Card`, `Stat`, `DescriptionList` and every chart render busy while `loading` is true: the content stays, dimmed and pulsing, with `aria-busy` set.
- **Breaking: `Icon` and every `icon` prop take a name from a fixed set.** The catalog imports ~96 named icons instead of the whole lucide namespace, so a consumer bundle carries 8.6 KB gzipped instead of 175 KB. The names appear once in the prompt as the shared type `IconName`. `Icon.color` is a theme vocabulary (`default`, `muted`, `primary`, `destructive`, `success`, `warning`), not a Tailwind class fragment.
- **Breaking: no prop takes free-form text where the value comes from a fixed set.** Chart colours are palette names (`ChartColor`), sizes are named (`Width`, `Height`, `ColumnWidth`) or pixel counts, code languages, currencies, locales, calling codes, file kinds, keyboard keys and filter operators are enums, and dates and times are `z.iso.date()` / `z.iso.time()` / `z.iso.datetime()`.
- **Breaking: `TreeView.items` nests to any depth.** It was unrolled two levels deep and then `z.any()`. `FileUpload.accept` is now a list of kinds, not a comma-joined string. `Kbd.keys` and every menu `shortcut` are key-name arrays.
- Numeric props carry their bounds: percentages are 0-100 (`ProgressBar.value` runs from 0 to `max`), indices and counts are non-negative integers, pixel dimensions are positive integers, and map coordinates are within their real ranges.
- Callback payloads use `z.strictObject`, matching props.
- `ScatterChart.nameKey` is `name`, a string: the series name in the tooltip. It was typed as a colour.
- **Breaking: four components are renamed so that no component shares a name with a JavaScript or browser global:** `Map` is `LocationMap`, `Image` is `Picture`, `Text` is `Typography`, `Highlight` is `HighlightedText`. Their exports follow (`TypographyDef`, `TypographyImpl`, …). A catalog test fails on any such name.
- **Breaking: `LocationMap` draws map tiles itself.** 256-px raster tiles fill the `width` × `height` box, placed by the Web Mercator formula from `center` and `zoom`, and pins are placed by the same formula. It was an openstreetmap.org iframe over a fixed ±0.05° box, with pins placed by a different rule that missed their spot. `zoom` runs from 0 to 19 and changes what the map shows; `width` and `height` are at most 2048. Pins are buttons named by their label, which shows on hover or focus. The tiles come from OpenStreetMap, and their credit is always shown.
- **Breaking: `Link` renders an `<a href>`.** A click opens `href`, and `external` opens it in a new tab (`target="_blank" rel="noopener noreferrer"`). `href` is required; `onClick` and `disabled` are gone. A link navigates; an action is a `Button`.
- Descriptions match what renders: `Popover` (the trigger is a button labelled `triggerLabel`; every child renders in the panel), `PhoneInput.value` (without the calling code), `NotificationBadge.count` (0 hides the badge unless `showZero`), `HighlightedText.color` (four named colours, no CSS colour), `PieChart.colors` and `FunnelChart.colors` (one per slice or stage), `Sidebar` (collapses to icons; its sections do not collapse), `TreemapChart` (one rectangle per item, not nested), `TruncatedText` (a Show more toggle, no tooltip), `WaterfallChart.data[].isTotal` (the running total; its value is ignored), `ScrollArea.orientation` (vertical scrolling is always on), `Pagination` (without `totalPages`, the pages up to the current one).

### Removed

- `Callout`: use `Alert`. Callout's `tip` and `note` variants have no counterpart; `info` is the closest.
- **Breaking: `ChatThread`, `Collapsible`, `ConfirmDialog`, `CronBuilder`, `FilterBuilder`, `IconButton`, `MaskedInput`, `OrgChart`, `SankeyChart`, `SignaturePad`, `Skeleton`, `TagInput` and `VideoPlayer`.** `Accordion` covers `Collapsible`, a step's `confirm` covers `ConfirmDialog`, `Button` covers `IconButton`, and `MultiSelect` covers `TagInput`.
- Props and callbacks nothing implemented: `CodeEditor.language`, `CurrencyInput.min` and `max`, `Field.disabled`, `FieldLabel.htmlFor`, `TreemapChart.data[].color`.
- `ui/context-menu` and `ui/menubar`: only the removed `ContextMenu` and `Menubar` used them.
- **Breaking: `MarkdownViewer`.** Its markdown loaded images from any site and linked anywhere, past the renderer's `urlPolicy`. The catalog no longer depends on `streamdown`.

### Fixed

- Child entries placed straight in `Card`, `TabContent`, `AccordionItem` or a `Modal` with `side` touched. They sit in a column with a 16px gap now.
- A closed `Modal`, `Toast` or `CommandMenu` added an empty gap to the column or grid around it. Its placeholder is hidden now.
- A button inside a form submitted it: `Button`, `Rating`, `CopyButton`, `CodeBlock`, `Alert`, `Toast`, `Pagination`, `Stepper`, `TruncatedText` and `Sidebar` render `type="button"` now.
- `QRCode` has a quiet zone, which scanners need, and no card around it.
- Every option of a searchable `Select`, `MultiSelect` and `CommandMenu` looked highlighted. `catalog.css` defines the `data-*` state variants as shadcn does, so `data-selected="false"` no longer matches.
- `NavigationMenu` sub-items show the label above the description, as in shadcn's example; they sat side by side and overflowed.
- `NavigationMenu` opens on click only. It also opened on hover, so a click just after the hover-open closed it again.
- `Select` opens its list below the field, as wide as the field, with or without `searchable`.
- `ResizablePanel` applies a new `defaultSize` from the document; the panels kept the first one.
- `ResizablePanel` pads its panes; their content touched the border.
- `KanbanBoard`: a dropped card no longer disappears for a moment before it shows in its column. A card dropped on another card takes its place instead of going to the end of the column. In a narrow container the columns keep their width and the board scrolls; they overlapped.
- `CurrencyInput` shows the amount in the `locale`'s number format while it is not focused; `locale` changed only the `formatted` value. A currency code such as `CHF` no longer overlaps the amount.
- `Toast` is one box. It was an alert inside a card, and the card clipped the alert's corners. Its icons show the status color; they were the text color.
- `Timeline`: the icon in a default dot shows on a dark theme; it was white on a white dot.
- `FunnelChart` stage names fit in the chart; the widest stage's name was cut off.
- `GanttChart` bars are one piece; lines showed between the units.
- A searchable `Select` looks like the plain one when closed: the same chevron and text weight.
- `Link` is as wide as its text, with no side padding. In a column it stretched to the full width, its text centered.
- `Avatar`, `Timeline`, `VirtualList` and `DataGrid` show the pointer cursor only when a click callback is bound.
- `Timeline` draws the line between items; it stopped at each item's text.
- `TruncatedText` shows Show more only when the text is clamped.
- `HighlightedText` matches keep the text color. They were black, the browser's default for `<mark>`.
- `NotificationBadge` counts are solid, with a ring in the background color, so the element under them does not show through.
- `PieChart`, `FunnelChart` and `GanttChart` used a colour's name as the SVG fill; they look it up in the palette now, as the other charts do.
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
- `KanbanBoard`: cancelling a drag puts a card moved to another column back; it stayed there, and `onCardMove` never fired.
- `List` with `ordered: true` draws numbers; it drew bullets unless `styleType` said otherwise.
- `NavigationMenu` items without sub-items take keyboard focus.
- `Link`: `size: "lg"` enlarges the text, and `underline: "none"` no longer underlines on hover.
- `FileUpload` shows the not-allowed cursor when disabled.
- `FunnelChart` labels use the text colour; they were black, unreadable on a dark theme.
- `ResizablePanel` sizes are percentages, as the definition says: react-resizable-panels 4 read the numbers as pixels.
- `TreemapChart` draws every item; rectangles narrower than 30 px or shorter than 20 px were dropped.
- `WaterfallChart`'s tooltip shows a decrease as a negative value.
- `ProgressBar.max` must be positive; 0 gave the bar a NaN width.
- `MultiSelect` is rebuilt on Popover and Command. A click anywhere on an option toggles it, a click outside closes the list, and the list takes the arrow keys and Enter. The trigger nested a button in a button, a React hydration warning; only the checkbox toggled, and nothing closed the list but the trigger.
- `Carousel` with `orientation: "vertical"` showed every slide at once and stepped past them. Slides now share one cell, as tall as the tallest, and the vertical arrows sit at the top and bottom. `loop` with no slides no longer sets the index to NaN, and the arrow buttons have accessible names.
- Descriptions no longer claim what the implementation does not do: syntax highlighting in `CodeBlock`, a ⌘K shortcut in `CommandMenu`, formatted amounts in `CurrencyInput`, info, success and warning colours in `Alert`, a blue confirm button in `ConfirmDialog`, a shadow on `Card`.

### Changed

- Every schema in the catalog is `z.strictObject` again: an invented prop fails the element into its error slot instead of being silently dropped. The expression language got strict; the catalog follows.

### Changed

- URL-bearing props are now declared as URLs (`format: "uri-reference"`) so the renderer's `urlPolicy` validates them: `Picture.src`, `Avatar.src`, `AvatarGroup.avatars[].src`, `VideoPlayer.src`, `VideoPlayer.poster`, `OrgChart.nodes[].avatar`, `ChatThread.messages[].avatar`, and `Link.href`. A cross-origin URL in one of these is refused by default — add the host to the renderer's `urlPolicy` if it is trusted.

### Added

- Initial public beta of the component catalog: definition/implementation pairs over shadcn/Radix, the `allDefinitions` / `allImplementations` registries, and the common event schemas.
