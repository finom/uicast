# Changelog

All notable changes to this package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Every schema in the catalog is `z.strictObject` again: an invented prop fails the element into its error slot instead of being silently dropped. The expression language got strict; the catalog follows.

### Changed

- URL-bearing props are now declared as URLs (`format: "uri-reference"`) so the renderer's `urlPolicy` validates them: `Image.src`, `Avatar.src`, `AvatarGroup.avatars[].src`, `VideoPlayer.src`, `VideoPlayer.poster`, `OrgChart.nodes[].avatar`, `ChatThread.messages[].avatar`, and `Link.href`. A cross-origin URL in one of these is refused by default — add the host to the renderer's `urlPolicy` if it is trusted.

### Added

- Initial public beta of the component catalog: definition/implementation pairs over shadcn/Radix, the `allDefinitions` / `allImplementations` registries, and the common event schemas.
