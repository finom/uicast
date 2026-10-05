# Changelog

All notable changes to this package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.5] - 2026-10-05

### Changed

- The step count is rough; the 100 ms clock limits time.
- A text search costs the text's length times the pattern's; a locale list costs its length squared.
- `normalize()` and `localeCompare()` refuse more than 30 combining marks in a row.

### Fixed

- `padStart` and `padEnd` with an empty filler, and a `$` in a replacement, no longer exceed the budget.
- `JSON.stringify` counts escapes.
- A method's result counts once toward `maxTotalAllocation`.

## [0.0.3] - 2026-10-01

No changes.

## [0.0.2] - 2026-10-01

No changes.

## [0.0.1] - 2026-09-30

The first release. Earlier changes are in the [pre-release changelog](https://github.com/finom/uicast/blob/a2eaa7703496f7679efd56f5309ee08a1dd4209b/packages/expr/CHANGELOG.md).
