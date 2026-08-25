# Changelog

All notable changes to this package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial public beta of the component catalog: definition/implementation pairs over shadcn/Radix, the `allDefinitions` / `allImplementations` registries, and the common event schemas.

### Changed

- Charts render without mount animations, so streaming re-renders don't restart them.
- Calendar updated for react-day-picker 10 (`month_grid` class name).
