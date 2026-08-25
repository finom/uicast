# Changelog

All notable changes to this package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial public beta of the framework-agnostic uicast engine: entry format, sandboxed JavaScript expressions, reactive scopes, and prompt partial builders.
- Prompt signatures carry schema descriptions: any described field (Zod `.describe()` / `.meta({ description })`) renders inline as `type /* description */`, at every nesting level — objects, arrays, enums, tuples, unions, `$ref`s.
- Function signatures in the prompt render multiline, one field per line, via `JSONSchemaToTs`'s new `multiline` option.

### Changed

- Reactive writes wake descendant-path subscribers: replacing `products` re-renders a reader of `products.length`. The reverse stays exact.
- The contract no longer mentions a `deps` array — the runtime extracts the read set from expression text.
