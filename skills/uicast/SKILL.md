---
name: uicast
description: "Integrate uicast (LLM-generated UI, streamed as JSONL and rendered live) into a React app. Use when asked to add generative UI, let the model build the interface, render AI-generated components, set up uicast, make a chatbot answer with live UI, or stream UI from the model. Covers components (definitions and implementations), host functions, prompt assembly, the renderer, page and chat (Streamdown) surfaces, and errors. Not for writing uicast entries by hand: the assembled prompt teaches the model the format. Self-contained: no external docs needed."
license: MIT
metadata:
  author: Andrey Gubanov
  version: "0.2"
---

# uicast integration

Model streams JSONL **entries**; each names a component you register; **uicast** renders them live. You own components, host functions and prompt. Model writes entries; prompt teaches it how. Never write entries yourself.

## Install

```bash
npm install @uicast/expr@beta @uicast/core@beta @uicast/react@beta @uicast/shadcn-catalog@beta standard-tool zod
```

Page streaming below also uses `ai` and `@tanstack/react-query`. Chat surface: add `@uicast/streamdown@beta streamdown`. React 19.2. Packages are beta: `@beta` tag.

| Package | Role |
| --- | --- |
| `@uicast/expr` | Expression evaluator; host functions bind on it. |
| `@uicast/core` | Entry types, streaming helpers, errors; prompt builders in `@uicast/core/prompt`. |
| `@uicast/react` | Renderer. |
| `@uicast/shadcn-catalog` | 106 ready components. Optional. |
| `@uicast/streamdown` | `uicast` fences in Markdown chat replies. |

Never import `@uicast/core/internal` or `@uicast/expr/internal`: plumbing, no semver.

## Pick surface

- **Page**: model reply is raw JSONL → `<EntriesRenderer>`. Page builders, dashboards.
- **Chat**: reply is Markdown, UI in ` ```uicast ` fences → Streamdown plugin. Assistants answering with live UI.

## Lockstep rule

Prompt and renderer read same objects. Keep each in one module, import in both places:

- `defs` → `getComponentsPartialPrompt({ definitions: defs })`; matching `impls` → `<RendererProvider implementations={impls}>`
- `tools` → `getFunctionsPartialPrompt({ functions: tools })` and `new Evaluator({ functions: tools })`
- scope added in `init` → described in `getCommonInstructionsPartialPrompt({ note })`
- `urlPolicy` → provider and `getComponentsPartialPrompt({ urlPolicy })`
- `new Evaluator({ maxSourceLength })` → `getExpressionsPartialPrompt({ maxLength })`

Prompt promises what renderer lacks → runtime failure. Renderer has what prompt never mentions → unused.

## 1. Components

Using catalog only? Skip to [Catalog](#catalog).

**Definition**: what model reads. React-free: server imports it for prompt.

```ts
import { createComponentDefinition } from "@uicast/core";
import { z } from "zod";

export const StatCardDef = createComponentDefinition({
  name: "StatCard",
  description: "One key metric with a label and a trend arrow.",
  props: z.strictObject({
    label: z.string().meta({ description: "What the number measures" }),
    value: z.string(),
    trend: z.enum(["up", "down", "flat"]).default("flat"),
  }),
  callbacks: { onClick: z.null() }, // no payload: onClick()
});
```

- Every description (component, field `.meta({ description })`, callback) reaches model verbatim. Write like API docs.
- `z.strictObject`: prop model invented fails element visibly instead of vanishing.
- `.default()` applied before render and printed in prompt.
- No `children` field in props or payloads: reserved for child entries, throws. Text content: `text`, `title`, `label`.
- Callback payload = what entry steps read as `evt`. `onChange: z.strictObject({ value: z.string().meta({ description: "Current text" }) })` → model writes `evt.value`. `z.null()` → no payload, handler takes no argument.
- Payload shared by many components: `.meta({ $id: "MouseEvent" })` → printed once under `## Common Events`. One `$id` = one shape, else prompt builder throws. With catalog: reuse its `mouseEventSchema`, `keyboardEventSchema` from `@uicast/shadcn-catalog/events` (React-free).
- `hidden: true` → out of prompt, still renders.
- Schemas: Standard Schema with JSON Schema output. Zod 4.2+, Valibot, ArkType.

**Implementation**: React half.

```tsx
import { createComponentImplementation } from "@uicast/react";
import { StatCardDef } from "./def";

export const StatCardImpl = createComponentImplementation({
  def: StatCardDef,
  render: ({ label, value, trend, onClick, children }, { loading }) => (
    <button type="button" onClick={() => onClick()} aria-busy={loading}>
      {label}: <strong>{value}</strong> {trend === "up" ? "▲" : trend === "down" ? "▼" : "–"}
      {children}
    </button>
  ),
  skeleton: () => <div className="h-16 animate-pulse rounded bg-muted" />,
});
```

- Props arrive parsed: schema output, defaults filled. Bad props never reach `render`; element shows error instead.
- Every declared callback is async function, always callable, wired or not.
- Pass declared payload, never React event: `onChange={(e) => onChange({ value: e.target.value })}`. Schema parses it before steps run; rejected payload → `implementation` error, steps skipped.
- `children`: rendered child elements. Place them.
- Second argument: `{ entry, loading, scopes }`. `loading` true → show busy, keep content in place. Controls may ignore it.
- `skeleton` (optional): drawn while child not streamed yet or seed loading. Got `children` (even `null`) → draw element's own box around them; no `children` → fill one child's slot. No skeleton and no `fallbackComponents.defaultSkeleton` → nothing drawn.
- `render` may use hooks.

Layout, one folder per component:

```
src/uicast-catalog/
├── stat-card/
│   ├── def.ts    # createComponentDefinition, no React
│   └── impl.tsx  # createComponentImplementation
├── defs.ts       # export const defs = [StatCardDef, ...]
└── impls.ts      # export const impls = [StatCardImpl, ...]
```

## Catalog

```ts
import { defs } from "@uicast/shadcn-catalog/all/defs"; // prompt, server-safe
import { impls } from "@uicast/shadcn-catalog/all/impls"; // renderer
```

```css
@import "@uicast/shadcn-catalog/theme.css"; /* only without own shadcn setup: preflight + palette */
@import "@uicast/shadcn-catalog/catalog.css"; /* always */
```

- Styles read CSS variables (`var(--card)`): your theme restyles the catalog, status colors included (`--success`, `--warning`, `--info`, `--destructive`; `catalog.css` defaults the first three).
- Smaller prompt: `essential/defs` + `essential/impls` (29 components, about quarter of prompt), or groups: `layout`, `content`, `data`, `charts`, `forms`, `navigation`, `overlays`, each `<group>/defs` + `<group>/impls`.
- Extend: `[...defs, MyDef]`, `[...impls, MyImpl]`.
- Replace component: filter its name out of BOTH arrays, then append yours. Duplicate names throw.
- `ConfirmModal`, `RenderError` from `@uicast/shadcn-catalog` fit `fallbackComponents`; `Skeleton` from `@uicast/shadcn-catalog/ui/skeleton`.

## 2. Host functions

Model's only way to your data. One `standardTool` per function:

```ts
import { standardTool } from "standard-tool";
import { z } from "zod";

const Product = z
  .object({ id: z.number().int(), name: z.string(), stock: z.number().int() })
  .meta({ id: "Product" }); // printed once, under ## Shared Types

export const listProducts = standardTool({
  name: "listProducts",
  description: "Products, newest first.",
  inputSchema: z
    .object({
      limit: z.number().int().min(1).max(100).default(50),
      offset: z.number().int().min(0).default(0),
      q: z.string().optional().meta({ description: "Matches the name" }),
    })
    .optional(), // so listProducts() is valid
  outputSchema: z.object({ items: z.array(Product), total: z.number().int() }),
  execute: async (input) =>
    (await fetch("/api/products/search", { method: "POST", body: JSON.stringify(input ?? {}) })).json(),
});

export const deleteProduct = standardTool({
  name: "deleteProduct",
  description: "Deletes one product.",
  inputSchema: z.object({ id: z.number().int() }),
  execute: async ({ id }) => {
    await fetch(`/api/products/${id}`, { method: "DELETE" });
  },
});
```

```ts
// src/tools/index.ts: one array for prompt and evaluator
export const tools = [listProducts, deleteProduct];
```

- `execute` runs where renderer runs: browser. Fetch your API. DB client or secret here ships to client bundle.
- One argument, `inputSchema`. Object with described fields. All fields optional → `.optional()` on object.
- `outputSchema` whenever UI shows result. Without it prompt prints `=> unknown`: model may only call for effect, then refetch. Never `z.void()`: no JSON Schema, throws.
- Validators and defaults print in prompt; model calls within them.
- List functions: page window (`limit`/`offset` or `page`), sort, filters in; `{ items, total }` out. Model pages and filters through them. Sums and counts: own functions.
- `title` (optional): human label model may reuse on button.
- Name: JS identifier, unique; not `scopes`, `evt`, `currentValue`, or global like `Math`. `Evaluator` and prompt builder throw otherwise.
- Input schema rejects call → `invalid-arguments` (model's mistake). `execute` throws → `host-function` (yours).

## 3. Prompt

```ts
import {
  getCommonInstructionsPartialPrompt,
  getComponentsPartialPrompt,
  getExpressionsPartialPrompt,
  getFunctionsPartialPrompt,
  getScopePartialPrompt,
} from "@uicast/core/prompt";
import { tools } from "@/tools";
import { defs } from "@/uicast-catalog/defs";

export const system = [
  getCommonInstructionsPartialPrompt(),
  getScopePartialPrompt({ kind: "page" }), // "page" | "widget" | "answer"
  getComponentsPartialPrompt({ definitions: defs }),
  getFunctionsPartialPrompt({ functions: tools }),
  getExpressionsPartialPrompt(),
].join("\n\n");
```

- Keep this order. Chat: append `getFencePartialPrompt()` from `@uicast/streamdown/prompt`, last.
- `kind`: whole page, one embeddable widget, or compact chat answer. `approxEntries`: size hint.
- `getCommonInstructionsPartialPrompt({ maxListItems })`: list cap, default 100.
- Every builder takes `note`: your text, appended as `## Note`.
- Build once, at module scope.

## 4. Mount

```tsx
"use client";
import type { ComponentEntry, EntryError } from "@uicast/core";
import { Evaluator } from "@uicast/expr";
import { EntriesRenderer, RendererProvider } from "@uicast/react";
import { ConfirmModal, RenderError } from "@uicast/shadcn-catalog";
import { tools } from "@/tools";
import { impls } from "@/uicast-catalog/impls";

// Module scope: new identities re-render every element.
const evaluator = new Evaluator({ functions: tools });
const fallbackComponents = { confirm: ConfirmModal, error: RenderError };
const onError = (error: EntryError) => console.error(error.reason, error.elementKey, error.message);

export function Generated({ entries }: { entries: ComponentEntry[] }) {
  return (
    <RendererProvider
      implementations={impls}
      evaluator={evaluator}
      fallbackComponents={fallbackComponents}
      onError={onError}
    >
      <EntriesRenderer entries={entries} />
    </RendererProvider>
  );
}
```

- One provider = one shared `root` scope for every renderer under it. Place high: one per state universe.
- `fallbackComponents`: `defaultSkeleton` (else nothing drawn), `confirm` (else `window.confirm`), `error` (else plain div).
- `init={({ scopes }) => { scopes.root.user = currentUser; }}`: runs once, before entries evaluate. Returns promise → renderers show skeleton until resolved.
- `urlPolicy`: URLs a URL-format prop may load. Default: relative, same origin, raster `data:` images. Widen: `{ hosts: ["cdn.example.com"] }`.

**Host scope the model reads** (signed-in user, app context):

```tsx
import { createProxyScope } from "@uicast/core";
import type { InitFn } from "@uicast/react";

const userCtx = createProxyScope({ name: "Ada", plan: "pro" }); // module scope
const init: InitFn = ({ scopes }) => {
  scopes.userCtx = userCtx;
};
// <RendererProvider init={init} ...>; later userCtx.plan = "free" → every reader re-renders

getCommonInstructionsPartialPrompt({
  note: "scopes.userCtx holds the signed-in user: name (string), plan ('free' | 'pro'); read-only.",
});
```

Note is all model knows about scope: spell out every field.

## 5. Page surface

Server: pass model text through. Example: Next.js route + AI SDK; any streaming endpoint works.

```ts
import { createTextStreamResponse, streamText } from "ai";
import { system } from "@/prompt";

export async function POST(req: Request) {
  const { prompt } = await req.json();
  const result = streamText({ model: "anthropic/claude-opus-5.5", system, prompt });
  return createTextStreamResponse({
    stream: result.textStream,
    headers: { "content-type": "application/jsonl; charset=utf-8" },
  });
}
```

Client: TanStack Query's `streamedQuery` grows array per line:

```tsx
import { experimental_streamedQuery as streamedQuery, useQuery } from "@tanstack/react-query";
import { type ComponentEntry, streamJsonLines } from "@uicast/core";

const { data: entries = [] } = useQuery({
  queryKey: ["generate", prompt],
  staleTime: Infinity, // else window focus refetches = new model call
  retry: false,
  queryFn: streamedQuery({
    // No `signal`: unmount would cancel generation.
    streamFn: async () => {
      const res = await fetch("/api/generate", { method: "POST", body: JSON.stringify({ prompt }) });
      if (!res.ok || !res.body) throw new Error(`Generation failed (${res.status})`);
      return streamJsonLines<ComponentEntry>(res.body);
    },
  }),
});
// <Generated entries={entries} />
```

- Each new line needs new array. `entries.push(x)` renders nothing.
- `streamJsonLines` yields each line that parses as JSON; skips prose, fences, cut-off last line.
- **Persist**: tee on server. Loop `streamJsonLines(result.textStream)`, keep values passing `isComponentEntry`, store each, forward `JSON.stringify(value) + "\n"`. Restore: stored entries → `<EntriesRenderer>`. `Object.values(buildElementsByKey(entries))` = entries as rendered, re-emits folded: store that.
- **Edit turn**: stored entries as assistant message (one JSON per line), `getEditRequestPrompt({ request, missingKeys })` as user message. Append reply's entries to same document: same key replaces entry. `missingKeys`: keys in some `children` never emitted (cut-off reply).

## 6. Server rendering

Stored page, two options.

**Skeleton only** (simplest): `DocumentSkeleton` (from `@uicast/react`) draws page shape from entries alone, using impls' `skeleton`s and `defaultSkeleton`. Runs nothing: no expressions, seeds, host functions. First HTML gets layout; document runs after mount:

```tsx
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);
// inside <RendererProvider>:
{mounted ? <EntriesRenderer entries={entries} /> : <DocumentSkeleton entries={entries} />}
```

**Full render**: `<EntriesRenderer>` in server pass runs seeds, so first HTML has data.

- Two tool sets, same contract (name, description, schemas), different `execute`. Server set: reads DB, only functions seeds call. Browser set: calls your API, includes mutations. Callbacks run only in browser, so server render never changes data. Build prompt from full contract list.
- Server tools skip your API's auth: check user inside tool, return only what user may see.
- Pick set per bundle via `package.json` `imports`, then `import { tools } from "#tools"`:

  ```json
  { "imports": { "#tools": { "browser": "./src/tools/client/index.ts", "default": "./src/tools/server/index.ts" } } }
  ```

- Wrap renderer: `<Suspense fallback={<DocumentSkeleton entries={entries} />}><EntriesRenderer entries={entries} /></Suspense>`. Server has no error boundaries: unknown component, bad props or impl throw stops render up to nearest `<Suspense>`.
- Seeds run twice: server, then browser (scope values not transferred). Failed server seed → skeleton + `onError` on server; browser renders element again.
- Streaming HTML (Next.js App Router, `renderToReadableStream`): skeletons first, each element as its seed resolves.

## 7. Chat surface

```tsx
import { createFenceRenderer } from "@uicast/streamdown";
import { Streamdown } from "streamdown";

const plugins = { renderers: [createFenceRenderer()] }; // module scope

<RendererProvider implementations={impls} evaluator={evaluator}>
  {messages.map((m) => (
    <Streamdown key={m.id} plugins={plugins}>
      {m.text}
    </Streamdown>
  ))}
</RendererProvider>;
```

- One provider around whole conversation: every block shares `root`, so block in message 3 reads state block in message 1 wrote.
- Create fence renderer once. New one per render remounts blocks: seeds re-run, block state lost.
- Blocks render after mount. `createFenceRenderer({ ssr: true })` renders them in server pass too: full-render rules of §6 apply.
- `createFenceRenderer({ sourceToggle: MyToggle })`: your toggle above each block, props `showSource`, `onShowSourceChange`; switches block to its source.
- Streamdown wrapper (AI Elements' `Response`): passing `plugins` replaces its defaults. Re-add them beside fence renderer.

## 8. Errors

- Every failure is `EntryError`: shown in element's `error` slot and sent to `onError`. Callback failures have no slot: `onError` only. Check with `EntryError.is(err)`, not `instanceof`.
- `error.fault`:
  - `"document"`: model's mistake (`expression-syntax`, `guardrail-violation`, `budget-exceeded`, `unknown-reference`, `invalid-entry`, `unknown-component`, `invalid-list`, `invalid-props`, `invalid-arguments`). Fix by re-emitting entry.
  - `"environment"`: your code (`host-function`, `host-init`, `implementation`). Report it.
  - `"unknown"`: either (`expression-runtime`, `unknown`).
- Failure stays in its element; siblings, parents, state untouched.
- **Recovery loop** (optional): collect document faults, send `getErrorRecoveryPrompt({ failures: [{ key: error.elementKey, message: error.message, reason: error.reason }] })` as user turn, append reply's entries to same document. Re-emitted key resets element and retries failed seed.

## 9. Security: your part

Model output is untrusted, and so is data the model read (page text, function results): it can carry instructions.

- Document can call every function you give it, with any input its schema allows. Give `deleteProduct` → it can delete products. Expose only what user needs; check permissions on server for every call. Never count on prompt.
- Component props are model-written:
  - URL into `src`, `href`, `poster` only through prop declared `z.url()`: `urlPolicy` checks it before `render`. Plain string prop there is unchecked (`javascript:` link, data leaked through image URL).
  - Never put document text where it runs: `dangerouslySetInnerHTML`, `<style>`, `srcDoc`, `on*` attributes, raw CSS strings. Style object with fixed keys fine: `style={{ width }}`.
- Evaluator needs no CSP `unsafe-eval`.

## Traps

- Prompt and renderer fed from different arrays.
- `impls`, `evaluator`, `fallbackComponents`, `onError` or fence renderer created during render.
- React event passed as callback payload.
- DB client or secret in browser `execute`; mutation or missing auth check in server tool set.
- UI shows tool result, tool has no `outputSchema`.
- Host scope not described in `note`.
- `catalog.css` not imported: catalog unstyled.
- Catalog component replaced by appending, not filtering: duplicate names throw.
- Entries array mutated in place.
- String prop rendered into `href` or `src` without `z.url()`; document text in `dangerouslySetInnerHTML`.
