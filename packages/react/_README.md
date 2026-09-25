# @uicast/react

[![npm](https://img.shields.io/npm/v/@uicast/react)](https://www.npmjs.com/package/@uicast/react)

Part of [**uicast**](https://github.com/finom/uicast), the expression-driven generative UI framework.

Renders **uicast** documents in React, with your component implementations.

```sh
npm install @uicast/react@beta @uicast/core@beta @uicast/expr@beta
```

Needs React 19.2.

## Implement a component

An implementation pairs a [definition](https://uicast.dev/def) with the React code that renders it:

```tsx
import { createComponentImplementation } from "@uicast/react";
import { StatDef } from "./def";

export const StatImpl = createComponentImplementation({
  def: StatDef,
  render: ({ label, value }) => (
    <p>
      {label}: <strong>{value}</strong>
    </p>
  ),
  skeleton: () => <p className="stat-skeleton" />,
});
```

`render` gets the props, already evaluated and checked by the definition's schema, each callback as a function, and `children`. `skeleton` is optional: it draws the component while its data or children are on the way.

## Render a document

```tsx
import type { ComponentEntry } from "@uicast/core";
import { Evaluator } from "@uicast/expr";
import { EntriesRenderer, RendererProvider } from "@uicast/react";

// Once, at module scope: your host functions bind to it.
const evaluator = new Evaluator({ functions: tools });

export function Page({ entries }: { entries: ComponentEntry[] }) {
  return (
    <RendererProvider implementations={[StatImpl]} evaluator={evaluator}>
      <EntriesRenderer entries={entries} />
    </RendererProvider>
  );
}
```

`<EntriesRenderer>` is memoized on the array, so each streamed line must arrive in a new array. Every renderer under one provider shares the `root` scope; give a document its own provider to keep it apart.

| `RendererProvider` prop | What it does |
| --- | --- |
| `implementations` | Required. One per definition; a duplicate name throws. |
| `evaluator` | Required. Runs every expression, with your host functions bound. |
| `urlPolicy` | Which URLs a URL prop may hold. Default: relative and same-origin URLs, and `data:` raster images. |
| `fallbackComponents` | The UI the renderer draws itself: `defaultSkeleton`, `confirm` (default `window.confirm`) and `error`. |
| `init` | Runs once, when the first renderer mounts, to preload state or add scopes. |
| `onError` | Called once per failure, with an `EntryError`. |

## Server rendering

`<DocumentSkeleton entries>` draws the document's shape without running it, so it renders on the server. Show it until the page mounts, then `<EntriesRenderer>`. An `<EntriesRenderer>` rendered on the server calls your host functions there. See [Server rendering](https://uicast.dev/react/ssr).

## Props come from the model

The evaluator checks expressions, not what your JSX does with their results:

- Put URLs only in props the definition declares with `z.url()`. `urlPolicy` checks those before `render` runs.
- Never put document text where it can run: `dangerouslySetInnerHTML`, `<style>`, `srcDoc`, `on*` attributes.
- Send plain data from callbacks, never the DOM event.

## Documentation

[Component implementation](https://uicast.dev/react) · [Renderer](https://uicast.dev/react/renderer) · [Server rendering](https://uicast.dev/react/ssr) · [Error recovery](https://uicast.dev/error-recovery) · [API reference](https://uicast.dev/api-ref#uicastreact)

## License

[MIT](https://github.com/finom/uicast/blob/main/LICENSE) © [Andrey Gubanov](https://github.com/finom)
