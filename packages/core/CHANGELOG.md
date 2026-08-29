# Changelog

All notable changes to this package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `getExpressionsPartialPrompt({ allowGlobals })` prints extra global names alongside the built-in safe set, so a list passed to `<RendererProvider allowGlobals>` can be given to the model too. Without it the prompt still said "use ONLY these" and named only the built-ins, leaving the widened globals unreachable.

- Initial public beta of the framework-agnostic uicast engine: entry format, sandboxed JavaScript expressions, reactive scopes, and prompt partial builders.
- Prompt signatures carry schema descriptions: any described field (Zod `.describe()` / `.meta({ description })`) renders inline as `type /* description */`, at every nesting level — objects, arrays, enums, tuples, unions, `$ref`s.
- Function signatures in the prompt render multiline, one field per line, via `JSONSchemaToTs`'s new `multiline` option.
- `planStepWaves`: partitions a seed/callback step list into dependency waves — steps keep their order semantically while independent steps share a wave; `confirm` steps and caller-marked barriers isolate.
- Reactive scope emitters expose `version`, a monotonic count of emits, so a subscriber attaching after a write can tell it missed one.

### Changed

- A prop or event field with a schema `default` prints it, TypeScript-style: `- variant?: "neutral" | "info" = "neutral" — …`. The engine applies defaults before an implementation sees them, so the value is what the model gets by omitting the field; it used to be invisible, leaving the model to guess. Costs ~3% prompt size over the shadcn catalog.

- `# Common Events` describes each payload as a bullet list of fields (`- MouseEvent — …` then one line per field) instead of a one-line TypeScript type. Event fields now read the same wherever they appear — hoisted or inlined under a handler. Payloads with no fields (a `null` payload, a union) keep the inline type. The reference site is unchanged: a component still prints `onClick(evt: MouseEvent)`.

- `createComponentDefinition` accepts a def with no `props` at all — a layout wrapper or a divider no longer has to write `props: z.strictObject({})`. The omitted schema falls back to the exported `NO_PROPS`, a library-free empty-object spec, and the prompt prints no `Props:` line for it.

- **Breaking:** `createComponentDefinition` throws when a component's props — or a callback payload — declare `children`. That name belongs to the entry field listing child element keys, so a def taking it as a prop put two different things behind one name and let the renderer's React children silently overwrite the document's value. Name the prop for what it holds (`text`, `title`, `label`). Only the top level is reserved: a `children` field inside a prop's own shape, such as a tree node, is data and still allowed. The contract says the same — the prompt no longer describes a "special `children` prop".

- **Breaking:** `$set` throws when a parent on the path is not set, instead of creating it. Auto-creation made two document mistakes silent — a typo (`scopes.root.usre.name`) wrote a second key nobody reads, and `scopes.root.tags.0` built `{ "0": … }` instead of an array. The failure is now an `EntryError` with reason `unknown-reference`, a document fault, so the error slot shows it and recovery can feed it back. Seed the container first, or write the whole object at once. The prompt's matching rule changed with it.

- **Breaking:** an expression may no longer write to `scopes`, `evt`, or `currentValue` anywhere, not just at the top level. A function body still makes assignment legal (a `.reduce` accumulator, a local), but a write rooted at injected state is rejected as `sandbox-violation` at any depth, including through `++`, `delete`, and destructuring. Aliasing (`const s = scopes.root; s.x = 1`) is still undecidable statically, so purity remains a contract.
- **Breaking:** immediately-invoked function expressions are rejected. They existed only to run statements where a single value belongs; a callback passed to a method (`.map`, `.reduce`) is untouched and may still contain statements.

- Reactive writes wake descendant-path subscribers: replacing `products` re-renders a reader of `products.length`. The reverse stays exact.
- The contract no longer mentions a `deps` array — the runtime extracts the read set from expression text.
- `getFunctionsPartialPrompt` renders a tool's optional `title` ahead of its description, and prints `# Shared Types` *after* `# Function Details` — each listing's hoisted types now sit against the listing that uses them.
- Contract: `childScopes` must be read guarded (`scopes.root.childScopes?.row ?? []`) — it does not exist until the list has rendered. The component and function listings each carry their own `# Shared Types`; nothing is shared between them.
- `getFunctionsPartialPrompt` rejects a tool named `scopes`, `evt` or `currentValue` — those shadow the expression context, and the resulting failure was reported against the expression rather than the host — and rejects two tools sharing a name, matching the duplicate checks the component builder already made.
