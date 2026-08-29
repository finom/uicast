# Changelog

All notable changes to this package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- **Breaking:** the `defaultComponents` prop is now `fallbackComponents`, and its type `DefaultComponents` is `FallbackComponents`. The slots are the engine's fallback UI — a placeholder, a confirm dialog, an error slot — not defaults for anything the model names.

- **Breaking:** `<RendererProvider>` throws on a duplicate component name in `implementations` instead of logging and letting the later one win. `getComponentsPartialPrompt` already refuses to build a prompt from duplicate def names, so an implementations array carrying one could never have reached a working generation — while a `console.error` was easy to miss, leaving the wrong component rendering. Overriding a catalog component now means filtering its name out of both arrays.

- **Breaking:** props are parsed through the def's schema before `render` runs, and the implementation receives the schema's **output** — every `.default()` applied, so `render: ({ variant = "default" }) => …` is no longer needed (and the type never matched: `render` was already typed `InferOutput`). Props the schema rejects raise `invalid-props` before render instead of being classified after a crash, so a schema mismatch now fails whether or not the implementation happens to survive it.
- **Breaking:** a callback's `evt` is parsed through its payload schema before the steps run, and the steps see the parsed value. A payload the schema rejects fails the callback as `implementation` — the payload comes from the implementation, not the document, and a missing field would otherwise surface as the model's `evt.foo` quietly reading `undefined`. A payload-free handler called as `onPress()` still matches a `z.null()` schema.
- An async validator, or one that throws, is skipped in both places: a synchronous render can't await, and neither case is the document's fault.

### Added

- Initial public beta of the React binding: `<RendererProvider>` + `<EntriesRenderer>`, recursive renderer and registry, per-element error boundary, and the confirm seam.

### Fixed

- List item proxies refresh without emitting during render — replacing a list's backing array no longer triggers React's "update a component while rendering a different component" warning.
- Streaming placeholders render without a css import: the catalog's own skeleton replaces `react-loading-skeleton`.
- A callback the definition declares but an entry never wires now arrives as a no-op function instead of `undefined`. An implementation may call any handler its def declares without an optional-call guard.
- An element reading `scopes.<parent>.childScopes.<as>` no longer keeps a stale value when it mounts after the list has published — a subscriber that attaches between render and effect now catches up.

### Changed

- Seed and callback steps execute in dependency waves. A step that reads a path an earlier step writes waits for that write — `{ "set": "…city", "literal": "Oslo" }` followed by `getWeather({ city: scopes.root.city })` now works — while independent seed loads run in parallel as before. In callbacks, steps that call host functions never race (a refetch after a mutation keeps its order even with no path dependency); pure assignment steps with no mutual dependency may share a wave.

- **Breaking:** the mount API is now `<RendererProvider>` (implementations, functions, fallback UI, `allowGlobals`, `onError`, group `init`) wrapping `<EntriesRenderer entries={…} />`. The provider owns ONE shared reactive `root` scope for every renderer beneath it, so documents can share live state; `<Renderer>`, `<RendererConfigProvider>`, and the per-renderer `rootScope` are gone. Group `init` runs once for the whole provider, not per document.
