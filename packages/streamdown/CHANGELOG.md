# Changelog

All notable changes to this package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `getFencePartialPrompt({ note? })`: `note` appends host-specific context as the section's trailing `## Note`, matching every other **uicast** prompt partial.
- Initial public beta of the Streamdown plugin: uicast entries ride inside `uicast` code fences in Markdown chat replies, plus the matching fence prompt partial.
