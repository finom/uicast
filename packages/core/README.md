<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://uicast.dev/uicast-logo-dark.svg">
    <img alt="" src="https://uicast.dev/uicast-logo.svg" width="64">
  </picture>
</p>
<h1 align="center">@uicast/core</h1>
<p align="center">Part of <a href="https://github.com/finom/uicast"><strong>uicast</strong></a>, the expression-driven generative UI framework.</p>
<p align="center"><a href="https://uicast.dev">uicast.dev</a></p>
<p align="center"><a href="https://www.npmjs.com/package/@uicast/core"><img src="https://img.shields.io/npm/v/@uicast/core.svg?color=brightgreen" alt="npm version"></a> <a href="https://scorecard.dev/viewer/?uri=github.com/finom/uicast"><img src="https://api.scorecard.dev/projects/github.com/finom/uicast/badge" alt="OpenSSF Scorecard"></a> <a href="https://www.bestpractices.dev/projects/15106"><img src="https://www.bestpractices.dev/projects/15106/badge" alt="OpenSSF Best Practices"></a> <a href="https://github.com/finom/uicast/actions/workflows/ci.yml"><img src="https://github.com/finom/uicast/actions/workflows/ci.yml/badge.svg" alt="CI"></a></p>

The engine of **uicast**, without React: component definitions, the entry format, reactive scopes, error classification and the prompt builders. [`@uicast/react`](https://www.npmjs.com/package/@uicast/react) renders on top of it.

```sh
npm install @uicast/core @uicast/expr
```

## Define a component

A definition is what the model reads about a component. It imports no React, so the prompt can be built on the server.

```ts
import { createComponentDefinition } from "@uicast/core";
import z from "zod";

export const StatDef = createComponentDefinition({
  name: "Stat",
  description: "One number with a label. Use it for a KPI, not for a table cell.",
  props: z.strictObject({
    label: z.string().meta({ description: "What the number means" }),
    value: z.number().meta({ description: "The number itself" }),
  }),
});
```

`props` and each payload in `callbacks` are schemas that implement [Standard Schema](https://standardschema.dev/schema) and [Standard JSON Schema](https://standardschema.dev/json-schema): Zod 4.2+, Valibot or ArkType. Every `description` reaches the model word for word.

## Build the prompt

```ts
import {
  getCommonInstructionsPartialPrompt,
  getComponentsPartialPrompt,
  getExpressionsPartialPrompt,
  getFunctionsPartialPrompt,
  getScopePartialPrompt,
} from "@uicast/core/prompt";

const system = [
  getCommonInstructionsPartialPrompt(),
  getScopePartialPrompt({ kind: "page" }),
  getComponentsPartialPrompt({ definitions: [StatDef] }),
  getFunctionsPartialPrompt({ functions: tools }),
  getExpressionsPartialPrompt(),
].join("\n\n");
```

Keep this order: each block refers to earlier ones.

| Builder | Emits |
| --- | --- |
| `getCommonInstructionsPartialPrompt()` | The entry format and its rules. |
| `getScopePartialPrompt({ kind })` | What one response should be: `"page"`, `"widget"` or `"answer"`. |
| `getComponentsPartialPrompt({ definitions })` | The components, from your definitions. |
| `getFunctionsPartialPrompt({ functions })` | The signatures of your [host functions](https://uicast.dev/expr/functions). |
| `getExpressionsPartialPrompt()` | The expression language. |

Each takes `note`: your text, added at the end of its block. Two more builders make a user message for one turn:

- `getEditRequestPrompt({ request, missingKeys })` asks for a change to a stored page. The model sends only the entries that change; a line with an existing key replaces that entry. `buildElementsByKey(entries)` applies the same rule to stored lines.
- `getErrorRecoveryPrompt({ failures })` names the elements that failed, so the model sends them fixed.

## Read the stream

`streamJsonLines` yields each line of a stream that parses as JSON, and skips the rest: code fences, prose, a cut-off last line. On the server, store each entry as it arrives:

```ts
import { isComponentEntry, streamJsonLines } from "@uicast/core";

for await (const value of streamJsonLines(result.textStream)) {
  if (isComponentEntry(value)) await saveEntry(value);
}
```

In the browser, `streamJsonLines<ComponentEntry>(res.body)` feeds the renderer. See [Streaming](https://uicast.dev/streaming).

## Errors

Every element failure is an `EntryError`. Its `fault` says whose code failed: `"document"` means the model wrote the bug, so sending it back can fix it; `"environment"` means your code failed.

```ts
import type { EntryError } from "@uicast/core";
import { getErrorRecoveryPrompt } from "@uicast/core/prompt";

function onError(error: EntryError) {
  if (error.fault !== "document" || !error.elementKey) return report(error);
  sendUserMessage(
    getErrorRecoveryPrompt({
      failures: [{ key: error.elementKey, message: error.message, reason: error.reason }],
    }),
  );
}
```

The renderer calls `onError` once per failure. See [Error recovery](https://uicast.dev/error-recovery).

## Exports

| Export | What it does |
| --- | --- |
| `createComponentDefinition(def)` | Builds a component definition. |
| `streamJsonLines(source)` | Yields each JSON line of a byte or text stream. |
| `isComponentEntry(value)` | Checks that a parsed value is an entry. |
| `buildElementsByKey(entries)` | Folds entries into a `key → entry` map, applying replacements. |
| `createProxyScope(initial?)` | A reactive scope, for a [scope your app adds](https://uicast.dev/react/renderer#extra-named-scopes). |
| `EntryError` | The error every element failure arrives as. |

The prompt builders come from `@uicast/core/prompt`.

## Documentation

[Concepts](https://uicast.dev/concepts) · [Component definition](https://uicast.dev/def) · [Assembling the prompt](https://uicast.dev/prompt) · [Entry fields](https://uicast.dev/entry) · [Streaming](https://uicast.dev/streaming) · [Error recovery](https://uicast.dev/error-recovery) · [API reference](https://uicast.dev/api-ref#uicastcore)

## License

[MIT](https://github.com/finom/uicast/blob/main/LICENSE) © [Andrey Gubanov](https://github.com/finom)
