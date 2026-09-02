---
name: uicast
description: "Integrate uicast — LLM-generated UIs rendered live from streamed JSONLines — into an app. Use when asked to \"add generative UI\", \"let the LLM build the interface\", \"render AI-generated components\", \"set up uicast\", \"make the chatbot answer with real UI\", \"stream UI from the model\", or any phrasing of \"the AI should produce working screens, not code\". Covers the developer-side setup end to end: component definitions and implementations, host functions, prompt assembly, mounting the renderer, host state and extra scopes, streaming on a page surface or a chat surface (Streamdown fences), and error handling. Framework-agnostic — Next.js appears only as one example host. Does not cover authoring uicast documents by hand: the entry format is the generation model's contract, delivered by the assembled prompt at runtime. Self-contained — do not fetch external docs; if a step looks wrong, that is a skill bug — surface it."
license: MIT
metadata:
  author: uicast
  version: "0.1"
---

# uicast integration

uicast renders a UI from JSONLines the LLM streams: one JSON object per line, each
line one element referencing a registered component. The host owns the components,
the state seam, and the prompt; the model only fills a page with them. You never
author those lines — the assembled prompt teaches the model the format. Your job
is everything around it, and that is what this skill covers.

## Packages

| Package | Role |
| --- | --- |
| `@uicast/core` | Engine, framework-free: entry types, expression guardrail, reactive scopes, prompt builders (`@uicast/core/prompt`). |
| `@uicast/react` | React binding: `<RendererProvider>`, `<EntriesRenderer>`, `createComponentImplementation`. |
| `@uicast/shadcn-catalog` | ~150 ready components as definition/implementation pairs over shadcn/Radix. Optional — you can ship only your own. |
| `@uicast/streamdown` | Chat surface: renders ```uicast fences inside Markdown replies via Streamdown. Only for chat hosts. |

```bash
npm i @uicast/expr@beta @uicast/core@beta @uicast/react@beta @uicast/shadcn-catalog@beta standard-tool zod
```

The packages are beta — install under the `@beta` dist-tag. Add
`@uicast/streamdown@beta streamdown` (Streamdown 2.5+) for a chat surface, and
`@tanstack/react-query` for the recommended streaming setup. React 19+ is
required. Packages ship compiled ESM + types — no bundler configuration.
Schemas are Standard Schema; examples use Zod v4, Valibot and ArkType qualify
too. Host functions are built with `standardTool()` from `standard-tool`.

Never import from `@uicast/core/internal` — engine plumbing, breaks without notice.

## Pick the surface first

- **Page surface** — the model's whole reply is raw JSONL; you stream it into
  `<EntriesRenderer>`. For page builders, dashboards, "generate me an app" flows.
- **Chat surface** — the reply is Markdown; UI rides inside ```uicast code fences,
  mounted by the Streamdown plugin. For assistants that answer with live UI.

Same engine, same catalog, same provider. Differences: how the model is told to
emit (one prompt partial) and how entries reach the renderer.

## The lockstep rule (most integration bugs live here)

The prompt is **derived from the same objects the renderer receives**. Whatever
you pass to `<RendererProvider>` must feed the matching prompt builder, from the
same source of truth:

- `implementations` (their `def`s) ↔ `getComponentsPartialPrompt({ definitions })`
- `functions` ↔ `getFunctionsPartialPrompt({ functions })`
- extra scopes assigned in `init` ↔ `getCommonInstructionsPartialPrompt({ note })`

A capability the prompt never mentions is unreachable; one the prompt promises but
the provider lacks fails at runtime. Keep each pair in one module and import it in
both places.

## 1. Define components

A **definition** is what the model reads. Schema = contract: props the schema
rejects fail before render, with the fault pinned on the document.

```ts
import { createComponentDefinition } from "@uicast/core";
import { z } from "zod";

export const StatCardDef = createComponentDefinition({
  name: "StatCard", // PascalCase, unique across the catalog
  description: "One key metric with a label and an optional trend arrow.",
  props: z.strictObject({
    label: z.string().meta({ description: "What the number measures" }),
    value: z.string(),
    trend: z.enum(["up", "down", "flat"]).default("flat"),
  }),
  callbacks: {
    onClick: z.null(), // null payload = handler carries no event data
  },
});
```

Rules that matter:

- **Descriptions are prompt text.** The component `description`, every field's
  `.meta({ description })`, every callback description reach the model verbatim.
  Vague descriptions produce vague generations — write them like API docs.
- **Use `z.strictObject`**: a prop the model invented fails the element into
  its error slot instead of being silently dropped — visible and correctable.
- **Defaults are applied by the engine** before the implementation sees props,
  and printed in the prompt (`trend?: ... = "flat"`), so the model knows what
  omission means. No `= "flat"` destructuring needed in `render`.
- **`children` is reserved** at the top level of props and callback payloads —
  it is the entry field listing child element keys. Name content props `text`,
  `title`, `label`. A `children` field nested deeper (a tree node) is fine.
- **Shared event payloads**: give the payload schema a JSON Schema `$id` —
  Zod: `.meta({ $id: "MouseEvent", description: "..." })`. Every callback using
  it is hoisted into one `# Common Events` block instead of re-inlining the
  shape per component. One `$id` must mean one shape — two payloads claiming it
  throw at prompt assembly.
- `props` may be omitted entirely for a wrapper or divider.
- `z.null()` payload means the implementation calls the handler with no argument.
- `hidden: true` on a def keeps it out of the prompt but in the registry — for
  host-only components an entry may name but the model must never emit.

## 2. Implement components

The **implementation** is the React half, paired to its def:

```tsx
import { createComponentImplementation } from "@uicast/react";
import { StatCardDef } from "./def";

export const StatCardImpl = createComponentImplementation({
  def: StatCardDef,
  render: ({ label, value, trend, onClick, generatedKey, children }) => (
    <button type="button" onClick={() => onClick()} data-key={generatedKey}>
      <span>{label}</span>
      <strong>{value}</strong> {trend === "up" ? "▲" : trend === "down" ? "▼" : "—"}
      {children}
    </button>
  ),
  placeholder: ({ reason }) => <div className="skeleton" data-reason={reason} />,
});
```

The render contract:

- Props arrive **parsed** — schema output, defaults applied, exactly what the
  types say. A mismatch never reaches `render`; it becomes a classified error.
- Every callback the def declares is a callable async function, wired or not —
  call `onClick()` without optional-call guards. The argument you pass is the
  payload (schema input); the engine parses it before the document's steps see it.
- **A React event object is not a payload.** Build the declared shape by hand:
  `onChange={(e) => onChange({ value: e.target.value })}` — the model's
  `evt.value` resolves only because the implementation passed exactly the
  declared fields.
- `generatedKey` is the entry's unique key — use it for DOM ids so two instances
  of the same component never collide.
- `children` are the rendered child elements; place them where they belong.
- `placeholder` (optional) fills the component's content while a child entry
  hasn't streamed in (`reason: "streaming"` — the PARENT's placeholder fills
  the empty slot) or while its own async seed resolves (`"seeding"`). It beats
  the global `fallbackComponents.placeholder`; with neither, the pending slot
  renders **nothing** — there is no built-in placeholder.

### Where components live

One directory per component, def and impl side by side, re-exported from two
registry files (mirroring the shadcn catalog's own layout; the `src/` prefix
follows the project's setup):

```
src/uicast/
├── stat-card/
│   ├── def.ts        # createComponentDefinition — no React imports
│   └── impl.tsx      # createComponentImplementation, imports ./def
├── defs.ts           # export const definitions = [StatCardDef, ...]
└── impls.ts          # export const implementations = [StatCardImpl, ...]
```

`defs.ts` feeds `getComponentsPartialPrompt` (and can be imported server-side —
it must stay React-free); `impls.ts` feeds `<RendererProvider>`.

## Using the shadcn catalog

```tsx
import { allDefinitions } from "@uicast/shadcn-catalog/defs";
import { allImplementations } from "@uicast/shadcn-catalog/impls";
import "@uicast/shadcn-catalog/catalog.css";
```

- `catalog.css` (always) ships every utility the components use but **no
  palette** — every rule reads CSS variables (`var(--card)`), so your theme
  restyles the catalog. Add `theme.css` before it only when the app has no
  shadcn setup of its own: preflight plus the standard shadcn palette.
- **Extend**: concat your pairs — `[...allDefinitions, MyDef]` /
  `[...allImplementations, MyImpl]`.
- **Override**: duplicate names throw (in the provider and in the prompt builder
  alike), so replacing a catalog component means filtering its name out of BOTH
  arrays first, then appending yours.
- `@uicast/shadcn-catalog/fallback-components` exports `ConfirmModal` and
  `RenderError` for the provider's `fallbackComponents` slots.

## 3. Host functions

Host functions are the model's only reach into your backend — built with
`standardTool()`, callable from generated `seed`/`callbacks` expressions.
**`execute` runs where the renderer runs — the browser** — so reach your data
over HTTP; a database client here would ship its credentials to the client
bundle:

```ts
import { standardTool } from "standard-tool";
import { z } from "zod";

export const listProducts = standardTool({
  name: "listProducts",
  description: "All products, newest first.",
  outputSchema: z.array(
    z.object({
      id: z.number().int().meta({ description: "Product id" }),
      name: z.string(),
      qty: z.number().meta({ description: "Units in stock" }),
    }),
  ),
  execute: async () => (await fetch("/api/products")).json(),
});

export const deleteProduct = standardTool({
  name: "deleteProduct",
  description: "Delete one product by id.",
  inputSchema: z.object({ id: z.number().int() }),
  execute: ({ id }) => fetch(`/api/products/${id}`, { method: "DELETE" }),
});
```

Rules that matter:

- **Declare `outputSchema` whenever the result is meant to be read.** An
  undeclared return renders as `unknown` in the prompt, and the contract forbids
  the model to read fields off it — it can only call the function for its effect
  and re-fetch through a documented one. Effect-only mutations may skip it.
  Never `z.void()` for "nothing" — it has no JSON Schema form and throws.
- Input is **one argument** matching `inputSchema` — an object schema is
  preferred (each field gets a name and description the model reads); a scalar
  schema works too. No positional args, ever.
- Optional `title` is a human label printed before the description — wording
  the model can reuse for a button or heading that triggers the call.
- Names must be valid JS identifiers and must not be `scopes`, `evt`, or
  `currentValue` (they'd shadow the expression context). Duplicates throw.
- The input schema rejecting a call is the document's fault
  (`invalid-arguments`, recoverable by the model); any other `execute` throw is
  an environment fault.
- One array, two consumers: the provider's `functions` prop and
  `getFunctionsPartialPrompt` — import it in both from one module.

Layout: one file per tool — or per domain for a tight CRUD set — combined in
an index (the module both consumers import):

```
src/tools/
├── list-products.ts   # export const listProducts = standardTool({ ... })
├── delete-product.ts  # (or one products.ts exporting the whole CRUD set)
└── index.ts           # export const functions = [listProducts, deleteProduct]
```

## 4. Assemble the prompt

Two packages ship partials (`@uicast/core/prompt` and
`@uicast/streamdown/prompt`); the app owns the assembly. Compose with
`join("\n\n")` — partials carry no edge blank lines:

```ts
import {
  getCommonInstructionsPartialPrompt,
  getScopePartialPrompt,
  getComponentsPartialPrompt,
  getFunctionsPartialPrompt,
  getExpressionsPartialPrompt,
} from "@uicast/core/prompt";

export const systemPrompt = [
  getCommonInstructionsPartialPrompt(),          // output contract + expression context
  getScopePartialPrompt({ kind: "page" }),       // "page" | "widget" | "answer"
  getComponentsPartialPrompt({ definitions }),   // the component menu
  getFunctionsPartialPrompt({ functions }),      // the callable surface
  getExpressionsPartialPrompt(),                 // the expression language
].join("\n\n");
```

- Keep this order: the core partials first (instructions, scope, components,
  functions), the expression language after them, and — on chat surfaces — the
  fence partial last.
- `kind` sets ambition: a full page, one embeddable widget, or a compact
  conversational answer. `approxElements` is a soft size hint.
- Every partial takes `note` — host-specific context rendered as that section's
  trailing `## Note`, verbatim.
- Chat surface: append `getFencePartialPrompt()` from `@uicast/streamdown/prompt`
  as the last section — it inverts the raw-JSONL convention into fenced blocks.
- Regenerate nothing at request time that you can build once at module scope —
  the partials are pure functions of your catalog and tools.

## 5. Mount

```tsx
import { Evaluator } from "@uicast/expr";
import { RendererProvider, EntriesRenderer } from "@uicast/react";

const evaluator = new Evaluator({ functions }); // ONCE, module scope — holds the parse cache

<RendererProvider
  implementations={implementations} // stable reference — module scope or useMemo
  evaluator={evaluator}
  fallbackComponents={{ confirm: ConfirmModal, error: RenderError }}
  onError={(err) => report(err)}
  init={({ scopes }) => { scopes.root.user = currentUser; }}
>
  <EntriesRenderer entries={entries} />
</RendererProvider>
```

- The provider owns **one shared reactive `root` scope** for every renderer
  under it — several documents (chat blocks, page sections) behave as one app
  with one store. Mount one provider per state universe, high in the tree.
- An unstable `implementations` array or a new `evaluator` per render re-renders
  every node — keep them at module scope, or memoize.
- `fallbackComponents` slots: `placeholder` (streaming/seeding; omitted →
  **nothing**, pending slots stay empty), `confirm` (omitted →
  `window.confirm`), `error` (omitted → a bare inline-styled div).
- `evaluator` (required) is the expression evaluator with the host functions
  bound on it: `new Evaluator({ functions })` from `@uicast/expr`. It checks
  every read and call at run time and needs no CSP `unsafe-eval`.
- `init` runs once per provider group, before any entry evaluates; a returned
  Promise suspends the renderers until it resolves.

## Host state and extra scopes

Two ways to hand the model live host data:

- **Seed `root` in `init`** — `scopes.root.user = currentUser` (writes emit the
  same change events a document write would). Fine for state that belongs to the
  shared store.
- **A named scope the host keeps updating**: create the proxy above the provider,
  assign it in `init`, and declare it to the model:

```tsx
const userCtx = createProxyScope({ name: "Ada", plan: "pro" }); // module scope

init={({ scopes }) => { scopes.userCtx = userCtx; }}
// later, anywhere: userCtx.plan = "free" — subscribed elements re-render

getCommonInstructionsPartialPrompt({
  note: "scopes.userCtx holds the signed-in user: name (string), plan ('free' | 'pro').",
})
```

The note is **all the model ever sees of the scope** — spell out the shape in
it, field by field, or the model will guess.

## 6. Stream (page surface)

Server side — any HTTP endpoint that streams the model's text works; the model
already writes JSONLines, so the route passes text straight through. One
example host (Next.js route handler + the AI SDK — Express or Hono are the
same three lines around a different handler):

```ts
import { createTextStreamResponse, streamText } from "ai";
import { systemPrompt } from "@/prompt"; // the assembly from §4

export const maxDuration = 300; // generations run for minutes

export async function POST(req: Request) {
  const { prompt } = await req.json();
  const result = streamText({ model: "anthropic/claude-opus-5", system: systemPrompt, prompt });
  return createTextStreamResponse({
    stream: result.textStream,
    headers: { "content-type": "application/jsonl; charset=utf-8" },
  });
}
```

To persist, tee the stream server-side: `streamJsonLines` over
`result.textStream`, gate each value with `isComponentEntry`, store the line as
it completes, re-emit it downstream.

Client side — **recommended: TanStack Query's `streamedQuery`**. It takes the
`AsyncIterable` that `streamJsonLines` returns and appends each value to the
cached array, re-rendering per line — no hand-rolled loading flags, abort
handling, races, or accumulator state:

```tsx
import {
  experimental_streamedQuery as streamedQuery,
  useQuery,
} from "@tanstack/react-query";
import { type ComponentEntry, streamJsonLines } from "@uicast/core";

const { data: entries = [], isFetching } = useQuery({
  queryKey: ["generate", prompt],
  queryFn: streamedQuery({
    streamFn: async ({ signal }) => {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt }),
        signal,
      });
      if (!res.ok || !res.body) throw new Error(`Generation failed (${res.status})`);
      return streamJsonLines<ComponentEntry>(res.body);
    },
  }),
});

<EntriesRenderer entries={entries} />; // inside the provider
```

`entries` grows line by line while `isFetching` stays true — that is the
spinner. Any data layer works; this is a recommendation, not a dependency.
Whatever the layer, entries must arrive as a **new array reference** —
`entries.push(next)` on the same array renders nothing.

`streamJsonLines` skips blank lines, prose, fences, and the partial last line —
it yields only complete JSON values, but does **not** validate them: `<T>` is
your assertion. Gate untrusted lines with `isComponentEntry` before storing or
rendering. Elements mount progressively as lines land; child slots referenced
before they arrive show the placeholder.

**Persistence**: the document IS the JSONL — store lines as they arrive, replay
them into `<EntriesRenderer>` to restore the page. A re-emitted key replaces its
old subtree at render time; compact storage the same way with
`buildElementsByKey(entries)` (fold to the surviving `key → entry` map) so the
stored document matches what renders.

**Edit turns**: replay the current JSONL as an assistant message, then send
`getEditRequestPrompt({ request, missingKeys })` as the user message. The model
re-emits only the elements that change. `missingKeys` = keys referenced in some
`children` array but never emitted (a cut-off tail) — compute them off the
`buildElementsByKey` fold so the model re-emits instead of referencing ghosts.
A successful `seed` on a re-emitted key never re-runs — new state belongs on a
new key.

## Chat surface (Streamdown)

```tsx
import { createFenceRenderer } from "@uicast/streamdown";
import { Streamdown } from "streamdown";

const uicastRenderer = createFenceRenderer(); // ONCE, module scope

<RendererProvider implementations={implementations} evaluator={evaluator}>
  {messages.map((m) => (
    <Streamdown key={m.id} plugins={{ renderers: [uicastRenderer] }}>
      {m.content}
    </Streamdown>
  ))}
</RendererProvider>
```

- **Call `createFenceRenderer` once** (module scope or `useMemo`) and reuse the
  object. A fresh renderer per render remounts every block — seeds re-run, block
  state wipes.
- The provider wraps the whole conversation: every fence in every message shares
  the one `root` scope, so a widget in message 3 can read state a widget in
  message 1 wrote.
- Blocks mount client-side only (seeds and tool calls must not run during SSR);
  entries appear progressively as fence lines complete.
- `createFenceRenderer({ showSourceToggle: true })` adds a Rendered/Source
  switcher per block.
- Wrappers over Streamdown (e.g. AI Elements' response component) apply their
  own default plugin set, and passing `plugins` **replaces** it — recompose the
  defaults alongside the fence renderer:
  `plugins={{ cjk, code, math, mermaid, renderers: [fenceRenderer] }}`.

## Errors

Every failure surfaces as a classified `EntryError` — in the element's `error`
slot (render-time) or through `onError` (always, including callback failures,
which have no slot). Branch on `error.fault`:

- **`document`** — the model's output is wrong: `expression-syntax`,
  `guardrail-violation` (blocked syntax/API, a `set` that is not `scopes.<scope>.<field>`),
  `unknown-reference`, `unknown-component`, `invalid-list`, `invalid-props`,
  `invalid-arguments`. Fixable by a corrected re-emission.
- **`environment`** — host code failed: `host-function`, `host-init`,
  `implementation` (render threw on schema-legal props). The model cannot fix
  these; report them to monitoring.
- **`unknown`** — genuinely ambiguous: `expression-runtime` (a valid expression
  threw at runtime — the model wrote the path, the host may have written the
  value), and the defensive `unknown`.

Test with `EntryError.is(err)`, never `instanceof` — two copies of core can
coexist in one bundle.

Containment is per element: a broken element shows the error slot; siblings,
parents, and already-written state are untouched. Re-emitting the same `key`
with a corrected line resets the element and retries a failed seed.

**Self-healing loop (optional)**: collect document-fault errors from `onError`,
send `getErrorRecoveryPrompt({ failures: [{ elementKey, message, reason }] })`
as a follow-up user turn, append the model's corrected lines to the same
document. The error messages name the fix — forward them verbatim.

## Trap checklist

- Prompt and provider fed from different objects — the lockstep rule above.
- `implementations` / `functions` arrays re-created per render.
- `createFenceRenderer` called inside a component without `useMemo`.
- Extra scope declared without its shape in the description.
- Host function without `outputSchema` whose result the UI was supposed to show.
- Catalog styled but `catalog.css` (or your Tailwind pipeline) not imported —
  components render unstyled.
- Overriding a catalog component by appending instead of filtering — duplicate
  names throw on mount and in the prompt builder.
- Re-parsing the whole document into fresh entry objects every tick on a page
  surface — append parsed lines once; fresh identities re-render settled nodes
  and retry failed seeds.
- Mutating the entries array in place (`entries.push`) — same reference, the
  renderer memo-bails and nothing new mounts.
- Passing the raw React event object as a callback payload — build the declared
  shape field by field, or the model's `evt.*` reads `undefined`.
- A database or secret in a host function's `execute` — it runs in the browser;
  fetch your own API instead.
