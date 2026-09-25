# Changelog

All notable changes to this package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `ssr` on `createFenceRenderer`: `true` renders blocks in a server pass too, so their seeds run and host functions are called on the server. Off by default: a block renders after hydration.
- `getFencePartialPrompt({ note? })`: `note` appends host-specific context as the section's trailing `## Note`, matching every other **uicast** prompt partial.
- `FencePromptOptions`, the options type of `getFencePartialPrompt`, is exported from `@uicast/streamdown/prompt`, as core exports its builders' option types.
- Initial public beta of the Streamdown plugin: uicast entries ride inside `uicast` code fences in Markdown chat replies, plus the matching fence prompt partial.

### Changed

- **Breaking: `showSourceToggle` is `sourceToggle`, a component you pass.** It gets `showSource` and `onShowSourceChange` (the exported `SourceToggleProps`) and is drawn as-is above each block; the built-in buttons and their styles are gone. The source shows in Streamdown's `CodeBlock` instead of a styled `<pre>`.
- The fence prompt says entry, not element, for a line the model writes: "Entry keys are still per-fence", "a lone corrected entry".
