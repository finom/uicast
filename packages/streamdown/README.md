# @uicast/streamdown

[![npm](https://img.shields.io/npm/v/@uicast/streamdown)](https://www.npmjs.com/package/@uicast/streamdown)

Part of [**uicast**](https://github.com/finom/uicast), the expression-driven generative UI framework.

Renders **uicast** documents inside Markdown chat replies. The model puts entries in a code fence tagged `uicast`, and this [Streamdown](https://streamdown.ai/) plugin mounts each fence as a live document.

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

Needs Streamdown 2.5 and React 19.2.

Streamdown styles its output with Tailwind classes, so Tailwind has to scan its files. Add them to your CSS, with the path relative to that file, as [Streamdown's setup](https://streamdown.ai/docs/getting-started) says:

```css
@source "../node_modules/streamdown/dist/*.js";
```

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

Create the renderer once, at module scope: a new one on each render remounts every block.

| Option | Default | What it does |
| --- | --- | --- |
| `sourceToggle` | none | Your component, drawn above each block, that switches the block to its source. It gets `showSource` and `onShowSourceChange`. |
| `ssr` | `false` | Off: the server sends each block's skeleton, and the block renders after hydration. On: blocks render on the server, and their seeds call your host functions there. |

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
