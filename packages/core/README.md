# uicast

LLM-generated UIs rendered from a stream of JSONLines, composed from a
pre-built component catalog — with real client-side logic written by the model
as sandboxed JavaScript expressions.

This package is the **framework-agnostic engine**: the component entry format,
the SaferEval expression sandbox, reactive proxy scopes, classified errors
(`EntryError`), the tolerant JSONLines reader, and the prompt partial builders
that teach a model the output contract.

Bindings and companions live in the same repo under the `@uicast/*` scope:
`@uicast/react` (the `<Renderer>`), `@uicast/shadcn-catalog` (150+ component
def/impl pairs over shadcn/Radix), and `@uicast/streamdown` (render
```` ```uicast ```` fences inside Markdown chat replies).

> **Status: early.** The public API surface is still settling and this package
> ships raw TypeScript source (your bundler transpiles it — e.g. Next.js
> `transpilePackages: ["uicast"]`). Pin exact versions.

```ts
import { streamJsonLines, EntryError, isComponentEntry } from "uicast";
import { getCommonInstructionsPartialPrompt } from "uicast/prompt";
```

Documentation, demos, and the full story: **[github.com/finom/uicast](https://github.com/finom/uicast)**.
