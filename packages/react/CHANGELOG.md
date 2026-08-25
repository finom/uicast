# Changelog

All notable changes to this package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial public beta of the React binding: `<RendererProvider>` + `<EntriesRenderer>`, recursive renderer and registry, per-element error boundary, and the confirm seam.

### Fixed

- List item proxies refresh without emitting during render — replacing a list's backing array no longer triggers React's "update a component while rendering a different component" warning.
- Streaming placeholders render without a css import: the catalog's own skeleton replaces `react-loading-skeleton`.

### Changed

- Seed and callback steps execute in dependency waves. A step that reads a path an earlier step writes waits for that write — `{ "set": "…city", "literal": "Oslo" }` followed by `getWeather({ city: scopes.root.city })` now works — while independent seed loads run in parallel as before. In callbacks, steps that call host functions never race (a refetch after a mutation keeps its order even with no path dependency); pure assignment steps with no mutual dependency may share a wave.

- **Breaking:** the mount API is now `<RendererProvider>` (implementations, functions, fallback UI, `allowedGlobals`, `onError`, group `init`) wrapping `<EntriesRenderer entries={…} />`. The provider owns ONE shared reactive `root` scope for every renderer beneath it, so documents can share live state; `<Renderer>`, `<RendererConfigProvider>`, and the per-renderer `rootScope` are gone. Group `init` runs once for the whole provider, not per document.
