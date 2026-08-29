# Changelog

All notable changes to this package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial public beta of the component catalog: definition/implementation pairs over shadcn/Radix, the `allDefinitions` / `allImplementations` registries, and the common event schemas.
- Two stylesheets, so consuming the catalog needs no Tailwind wiring. `@uicast/shadcn-catalog/catalog.css` carries every utility the components use — no palette, no preflight, every declaration an indirection like `background-color: var(--card)` — so a consumer's own `@theme` overrides all of it. `@uicast/shadcn-catalog/theme.css` is the optional baseline (preflight plus the canonical shadcn palette) for a project that has not run `shadcn init`.

### Changed

- **Breaking:** the `@uicast/shadcn-catalog/default-components` entry point is now `@uicast/shadcn-catalog/fallback-components`, matching the renamed `fallbackComponents` prop it feeds. Same exports: `ConfirmModal`, `RenderError`.

- **Breaking:** `@uicast/shadcn-catalog/events` exports `allCommonEventSchemas` and nothing else — the one thing a consumer needs, to hand to `getComponentsPartialPrompt({ commonEvents })`. `mouseEventSchema`, `keyboardEventSchema` and the `pick*` helpers are internal to the catalog's own components: the catalog is a plug-and-play set, not a toolkit to build components against, and your own components carry your own event schemas.

- Implementations dropped 284 destructuring defaults (`variant = "default"`) across 118 components: the engine now applies the schema's `.default()` before `render` is called, so restating them was duplication that could drift.
- Props schemas are `z.object` rather than `z.strictObject`. Now that props are parsed, a prop the model invented is dropped instead of failing the whole element; a declared prop of the wrong type still fails, which is the case that actually breaks rendering.
- A `text` prop takes `string | number`, matching the prompt's rule that text positions accept either. It used to be `z.any()`.

- **Breaking:** the `children` prop is now `text`, on all 13 components that took it (`Badge`, `Button`, `DropdownMenuItem`, `FieldDescription`, `FieldLabel`, `Heading`, `Label`, `Link`, `TabTrigger`, `TableCell`, `TableHead`, `Tag`, `Text`) — core rejects a `children` prop outright. Documents must write `{ "text": "Refresh" }`. Nested elements are unaffected: an entry's `children` array still renders inside these components, and wins over `text` when both are given.

- `text` is typed `z.string()` rather than the old `z.any()`. The prompt now prints `text?: string` instead of `text?: unknown`, so the model is told what the prop takes; format numbers before passing them.
- Propless components (`Table`, `TableBody`, `TableFooter`, `TableRow`, `TableHeader`, `TabList`) drop their empty `props` schema, and `VideoPlayer`'s `onPlay` / `onPause` / `onEnded` carry `z.null()` like the catalog's other payload-free handlers.

- Component sources moved from `src/catalog/` to `src/uicast/`, naming the convention for where uicast pairs live in a consuming app. No published path changes.
- Arbitrary pixel sizes in the component implementations became scale utilities (`w-[400px]` → `w-100`, `min-w-[150px]` → `min-w-38`, `text-[10px]` → `text-xs`), so they follow a consumer's `--spacing` and type scale instead of being frozen.
- Charts render without mount animations, so streaming re-renders don't restart them.
- Calendar updated for react-day-picker 10 (`month_grid` class name).
- Callbacks that carry no payload declare `z.null()` instead of an empty object, across 13 handlers (`onCopy`, `onClear`, `onFocus`, `onConfirm`, `onCancel`, `onClose`, `onComplete`, `onAction`, `onDismiss`). The prompt prints `onCopy()` rather than `onCopy(evt: {})`, and the implementation's handler takes no argument.
