# Changelog

All notable changes to this package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `Pagination` works without a page count: `totalPages` is optional, and without it the control renders Previous, the pages up to the current one and Next, with `hasNext` (default `true`) gating Next — for a function that returns a page and no total. An ellipsis marks pages elided on either side.
- `TableHead.width`: a named column width. A column holding inputs or buttons has no intrinsic width, and an auto-layout table would give it almost none.

### Changed

- Pairs moved from `src/uicast/` to `src/uicast-catalog/`. Internal layout — the package's entry points are unchanged.
- Table containers and `Card` set `content-visibility: auto` with an intrinsic size, so off-screen tables and cards skip layout and paint. On a large page, resize and scroll no longer lay out every section.
- **Breaking:** `render(props, context)` — the second argument replaces `generatedKey`. `context.entry.key` is the entry's key (`data-key` on every root node), `context.loading` the entry's `loading` flag, `context.scopes` the scopes it reads.
- `Table`, `Card`, `Stat`, `DescriptionList` and every chart render busy while `loading` is true: the content stays, dimmed and pulsing, with `aria-busy` set.
- **Breaking: `Icon` and every `icon` prop take a name from a fixed set.** The catalog imports ~96 named icons instead of the whole lucide namespace, so a consumer bundle carries 8.6 KB gzipped instead of 175 KB. The names appear once in the prompt as the shared type `IconName`. `Icon.color` is a theme vocabulary (`default`, `muted`, `primary`, `destructive`, `success`, `warning`), not a Tailwind class fragment.
- **Breaking: no prop takes free-form text where the value comes from a fixed set.** Chart colours are palette names (`ChartColor`), sizes are named (`Width`, `Height`, `ColumnWidth`) or pixel counts, code languages, currencies, locales, calling codes, file kinds, keyboard keys and filter operators are enums, and dates and times are `z.iso.date()` / `z.iso.time()` / `z.iso.datetime()`.
- **Breaking: `TreeView.items` and `OrgChart.root` nest to any depth.** Both were unrolled two levels deep and then `z.any()`. `FileUpload.accept` is now a list of kinds, not a comma-joined string. `Kbd.keys` and every menu `shortcut` are key-name arrays. `Tag.onRemove` sends `null`, like every other payload-free callback.
- Numeric props carry their bounds: percentages are 0-100, indices and counts are non-negative integers, pixel dimensions are positive integers, and map coordinates are within their real ranges.
- Callback payloads use `z.strictObject`, matching props.

### Fixed

- `SearchInput.onSubmit` sends the input's live value, not the `value` prop it was last given.
- `NumberInput` keeps a minimum width (`5rem`), so it no longer collapses to nothing inside a table cell.
- `AccordionItem` content that loads after opening (rows fetched on open) was clipped at the height measured on open; the content wrapper no longer has a fixed height.
- `Slider` keeps a minimum width (`12rem`); in a wrapping flex row its track collapsed to the thumb alone.
- `DonutChart` fits its box: the ring is clamped to the chart height, the legend renders below the chart in its own space instead of over the ring, and the center label is centered on the ring, not on the box the legend shared.
- `AccordionItem` under a `single` Accordion coordinates by a per-instance id, not the entry key: items rendered by `each` share one entry key, so opening one opened them all.

### Changed

- Every schema in the catalog is `z.strictObject` again: an invented prop fails the element into its error slot instead of being silently dropped. The expression language got strict; the catalog follows.

### Changed

- URL-bearing props are now declared as URLs (`format: "uri-reference"`) so the renderer's `urlPolicy` validates them: `Image.src`, `Avatar.src`, `AvatarGroup.avatars[].src`, `VideoPlayer.src`, `VideoPlayer.poster`, `OrgChart.nodes[].avatar`, `ChatThread.messages[].avatar`, and `Link.href`. A cross-origin URL in one of these is refused by default — add the host to the renderer's `urlPolicy` if it is trusted.

### Added

- Initial public beta of the component catalog: definition/implementation pairs over shadcn/Radix, the `allDefinitions` / `allImplementations` registries, and the common event schemas.
