# Changelog

All notable changes to this package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial public beta of the Streamdown plugin: uicast entries ride inside `uicast` code fences in Markdown chat replies, plus the matching fence prompt partial.

### Changed

- **Breaking:** `createFenceRenderer` no longer takes renderer props — implementations, functions, and fallback UI come from the `<RendererProvider>` wrapping the conversation. All fences under one provider share its live `root` scope; the fence prompt partial now teaches key namespacing (`scopes.root.<app>…`) and first-writer-wins seeding instead of per-fence isolation.
