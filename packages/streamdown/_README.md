# @uicast/streamdown

[![npm](https://img.shields.io/npm/v/@uicast/streamdown)](https://www.npmjs.com/package/@uicast/streamdown)

Part of [**uicast**](https://github.com/finom/uicast), the expression-driven generative UI framework.

Renders **uicast** documents inside Markdown chat replies. The model puts entries in a code fence tagged `uicast`, and this [Streamdown](https://streamdown.ai/) plugin mounts each fence as a live document. Other fences stay highlighted code.

````md
Here are your open orders:

```uicast
{"key":"root","component":"Card","seed":[{"set":"scopes.root.orders","expr":"listOrders({ status: 'open' })"}],"children":["count"]}
{"key":"count","component":"Stat","props":{"expr":"({ label: 'Open orders', value: scopes.root.orders.length })"}}
```
````

```sh
npm install @uicast/streamdown@beta streamdown
```

Needs Streamdown 2.5 and React 19.2. The blocks render under your [`<RendererProvider>`](https://www.npmjs.com/package/@uicast/react).

## Use it

```tsx
import { Evaluator } from "@uicast/expr";
import { RendererProvider } from "@uicast/react";
import { impls } from "@uicast/shadcn-catalog/all/impls";
import { createFenceRenderer } from "@uicast/streamdown";
import { Streamdown } from "streamdown";

const evaluator = new Evaluator({ functions: tools });
const plugins = { renderers: [createFenceRenderer()] };

export function Chat({ replies }: { replies: string[] }) {
  return (
    <RendererProvider implementations={impls} evaluator={evaluator}>
      {replies.map((markdown, i) => (
        <Streamdown key={i} plugins={plugins}>
          {markdown}
        </Streamdown>
      ))}
    </RendererProvider>
  );
}
```

Create the renderer once, at module scope: a new one on each render remounts every block. Each complete line in a fence mounts at once; a cut-off last line waits for its newline.

| Option | Default | What it does |
| --- | --- | --- |
| `sourceToggle` | none | Your component, drawn above each block, that switches the block to its source. It gets `showSource` and `onShowSourceChange`. |
| `ssr` | `false` | Renders blocks in a server pass too. By default the server HTML holds each block's skeleton, and the block renders after hydration. With `ssr: true`, seeds run on the server and call your host functions there. |

## One conversation, one app

- Every block under one `<RendererProvider>` shares the `root` scope, so a button in a later reply can reload data an earlier block shows.
- Keys are per block; only state is shared.
- The prompt tells the model to seed everything a block reads, so any block can be saved as a standalone page.

## The prompt

`getFencePartialPrompt()` teaches the model the fence and the rules above. Add it after the core blocks:

```ts
import { getFencePartialPrompt } from "@uicast/streamdown/prompt";

const system = [
  getCommonInstructionsPartialPrompt(),
  getScopePartialPrompt({ kind: "answer" }),
  getComponentsPartialPrompt({ definitions: defs }),
  getFunctionsPartialPrompt({ functions: tools }),
  getExpressionsPartialPrompt(),
  getFencePartialPrompt(),
].join("\n\n");
```

## Wrappers that forward `plugins`

Chat kits that wrap Streamdown, such as AI Elements' response component, often replace their default plugins with the `plugins` you pass. Pass the defaults along: `{ cjk, code, math, mermaid, renderers: [fenceRenderer] }`.

## Documentation

[Streamdown plugin](https://uicast.dev/streamdown) · [Assembling the prompt](https://uicast.dev/prompt) · [Renderer](https://uicast.dev/react/renderer)

## License

[MIT](https://github.com/finom/uicast/blob/main/LICENSE) © [Andrey Gubanov](https://github.com/finom)
