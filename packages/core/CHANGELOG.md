# Changelog

All notable changes to this package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `@uicast/core/tool`: `exprTool({ read, functions, note })`, a tool the model calls to run steps on the UI's state in the browser; `read` is off by default ([#39](https://github.com/finom/uicast/pull/39)).

### Changed

- All expressions of one update share a 1 s budget; past it they fail as `budget-exceeded` ([#38](https://github.com/finom/uicast/pull/38)).

## [0.0.5] - 2026-10-05

### Changed

- Requires `@uicast/expr` ^0.0.5.

## [0.0.3] - 2026-10-01

### Changed

- **Breaking:** a scope's methods are `$emitter` and `$set` (were `$$emitter`, `$$set`).

## [0.0.2] - 2026-10-01

### Changed

- **Breaking:** the entry field `loading` is now `busy`.

## [0.0.1] - 2026-09-30

The first release. Earlier changes are in the [pre-release changelog](https://github.com/finom/uicast/blob/a2eaa7703496f7679efd56f5309ee08a1dd4209b/packages/core/CHANGELOG.md).
