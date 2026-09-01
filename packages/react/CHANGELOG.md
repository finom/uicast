# Changelog

All notable changes to this package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `evaluator` on `RendererProvider` (`"interpret"` | `"native"`) selects the expression back end for documents under the provider. `"interpret"` (default) needs no CSP `unsafe-eval`; `"native"` runs the validated source with `new Function` for trusted-author documents.
- `maxExpressionLength` on `RendererProvider` (default 1000): the longest expression source accepted, rejected before parsing. Pass the same value to `getExpressionsPartialPrompt({ maxLength })` so the model knows the limit.
- `urlPolicy` on `RendererProvider`: which URLs may reach a prop a definition declares as a URL. Defaults to relative, same-origin, and raster `data:` images; widen it with `{ hosts: ["cdn.example.com"] }` or pass a predicate. A rejected URL is a classified document fault in the element's error slot.

### Removed

- The `allowGlobals` prop, which was threaded through the provider but never read by the evaluator. Extra globals are a direct-`Evaluator` concern; the React binding does not widen the set.

### Fixed

- Prototype-reaching `set` paths (`scopes.root.__proto__.x`) are rejected at mount and before any step runs, alongside the existing numeric-key rule.

### Added

- Initial public beta of the React binding: `<RendererProvider>` + `<EntriesRenderer>`, the recursive renderer and registry, per-element error boundaries with classified errors, and the confirm seam.
