# Changelog

All notable changes to this package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial public beta of the framework-agnostic uicast engine: entry format, guarded JavaScript expressions (allow-list, not a sandbox), reactive scopes, and the prompt partial builders (`@uicast/core/prompt`). Binding plumbing lives in `@uicast/core/internal`, which carries no semver guarantee.
