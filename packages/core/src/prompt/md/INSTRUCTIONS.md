# Output Format

Build UI as JSONL: one **entry** per line, each complete JSON object. Output raw JSONL only — no prose, no reasoning, no code fences, no array wrapper. Plan silently.

Entry fields:

- `key` — unique id, kebab-case: `"save-btn"`.
- `component` — name from **Available Components**.
- `props` — `{ "literal": { ... } }` or `{ "expr": "..." }`.
- `children` — child keys, in render order.
- `seed` — steps run once, at mount.
- `callbacks` — steps run on events: `{ "onClick": [...] }`.
- `hidden`, `loading` — bare expressions.
- `each`, `as`, `keyBy` — make entry a list.

Emit parent before its children: root first, then depth-first.

`## Shared Types` in component or function listing names types reused in that listing: prop documented as `Person` means `Person` there. Type may refer to itself: `Node: { children?: Node[] }`.

# Rules

## 1. Structure

- Entries flat, never nested. Parent lists child keys in `children`.
- Exactly one root: entry no `children` lists. Every other entry listed exactly once. Every listed key emitted.

## 2. Props and expressions

- `literal`: JSON used verbatim, never evaluated. Use when props never change.
- `expr`: expression returning props object: `"props": { "expr": "({ value: scopes.root.count })" }`.
- Expression only computes. Only step's `set` writes state. Derive values inline; `props` re-run when field they read changes: `"props": { "expr": "({ rows: scopes.root.tasks.toSorted((a, b) => a.due - b.due) })" }`.
- Same state, same result. `props`, `hidden`, `loading`, `each` re-run only when field they read changes, maybe more than once. No clock, no `Math.random()`: time and random values come from host functions, if offered, called in step: `{ "set": "scopes.root.savedAt", "expr": "now()" }` when `now` exists.
- `children` never a prop. Text goes in component's text prop, often `text`.
- String or number prop takes string or number, never object or array: `({ text: scopes.member.name })`, not `({ text: scopes.member })`. Object and array props (`rows`, `options`) take what their type says.

## 3. State and seed

- `seed` steps: `{ "set": "scopes.<scope>.<field>", "literal": <value> }` or `{ "set": "scopes.<scope>.<field>", "expr": "..." }`. Every seed step has `set`.
- `set` names one field: `scopes.<scope>.<field>`. Nothing deeper, no index. To change part of object or array, write whole field: `{ "set": "scopes.root.filters", "expr": "({ ...currentValue, status: 'open' })" }`.
- Seed runs once, at first mount, writes only unset fields (first writer wins): initializes, never resets. Change state from callbacks.
- Seed calling host function shows element's skeleton until resolved. Never write `await`: runtime awaits.
- Step reading field earlier step writes waits for it; independent steps run in parallel. Child seeds run after parent's.
- Seed only reads data. Create, update, delete only from callbacks.
- No derived values in seed: runs once, value goes stale. Derive inline in `props`, `hidden`, `each`.
  - ❌ `"seed": [{ "set": "scopes.root.visible", "expr": "scopes.root.rows.filter(r => r.name.includes(scopes.root.q))" }]` with `"each": "scopes.root.visible"` — typing in search does nothing.
  - ✅ `"each": "scopes.root.rows.filter(r => r.name.includes(scopes.root.q))"`
- Unset field reads `undefined`; read below it throws. Seed state before reading, or guard with `?.` / `??`.
- Root entry seeds all root state.

## 4. Scopes

- `scopes.root`: page state.
- List with `"as": "row"` gives each item two scopes:
  - `scopes.row` — item itself: `scopes.row.name` reads its `name`.
  - `scopes.$row` — row: `index` (0-based), `id` (`keyBy` value, else index), `value` (item, when array holds strings or numbers). These three read-only. Host call takes data field, `scopes.row.id`.
- `as` names new scope: never `root`, host scope, or enclosing list's `as`; no leading `$`.
- Row's own UI state (expanded, editing, draft) goes in `scopes.$row`: starts unset, stays out of data, write re-renders only that row. Toggle: `{ "set": "scopes.$row.open", "expr": "!currentValue" }`. Only row and its children see it.
- State read outside row (select all, selected count) lives at root, keyed by row id. Read: `scopes.root.selected[scopes.$row.id] ?? false`. Toggle: `{ "set": "scopes.root.selected", "expr": "({ ...currentValue, [scopes.$row.id]: !currentValue[scopes.$row.id] })" }`. Select all, with `"keyBy": "id"`: `{ "set": "scopes.root.selected", "expr": "scopes.root.rows.reduce((m, r) => ({ ...m, [r.id]: true }), {})" }`. Seed `selected: {}` on root. Nested list: key by both ids, `scopes.$order.id + '/' + scopes.$line.id`.
- No other scopes unless note names them. Other `scopes.x` reads `undefined`; writing it fails.

## 5. Reactivity

- Automatic. `props`, `hidden`, `loading`, `each` subscribe to every `scopes.X.Y` they read; write re-renders readers. Reading whole scope (`Object.keys(scopes.root)`) subscribes to all its fields. `seed`, `callbacks` never subscribe.
- Write wakes readers below it: writing `scopes.root.user` wakes reader of `scopes.root.user.name`.
- Write to item field puts edited copy of item into array `each` reads, and in nested list into arrays above. `{ "set": "scopes.row.qty", "expr": "evt.value" }` updates `scopes.root.rows`, so totals and filters reading it update. Live total inline in props: `scopes.root.rows.reduce((s, r) => s + r.qty * r.price, 0)`.
- So `each` reads data itself, or `filter`, `toSorted`, `slice` of it. When `each` builds new objects (`rows.map(r => ({ ...r, total: r.qty * r.price }))`), row writes fail: compute per-row values in `props`.

## 6. Lists

- `each`: bare expression giving array, `"scopes.root.rows"` or derived `"scopes.root.rows.filter(r => r.active)"`; `null` or `undefined` gives no rows. `as`: required, names item scopes (§4). `keyBy`: item field holding unique id — set whenever items have one; without it rows key by index.
- List entry's component renders once per item: `"component": "TableRow"` gives one row per item. Its `props` and `children` see item scopes.
- Cap list whose size you don't control: `"each": "scopes.root.rows.slice(0, 🔴MAX_LIST_ITEMS🔴)"`, no-op on smaller data. Data past cap gets pages: function's window (§9) when it has one, else slice by page, `"each": "scopes.root.rows.slice((scopes.root.page - 1) * 50, scopes.root.page * 50)"`, callbacks writing `scopes.root.page`. Hide pager on one page: `"hidden": "scopes.root.rows.length <= 50"`. Search or filters only for data that can pass cap.
- List's own `seed` runs once for whole list, outside rows: no `scopes.$<as>` there.

## 7. Callbacks

- `"callbacks": { "onClick": [steps] }`. Only handlers component lists; others never fire.
- Step: `{ "set": "scopes.<scope>.<field>", "expr": "..." }`, or `"literal"` instead of `"expr"`. Step without `set` runs for its effect.
- `evt`: handler's payload; fields listed under component.
- `currentValue`: value at step's `set` field, `undefined` when unset. Toggle `!currentValue`, increment `currentValue + 1`, append `[...currentValue, item]`.
- Order: step reading field earlier step writes waits for it; host function call waits for every earlier step; row field write counts as write to list's array. Other steps may run together. Save-then-refetch just works.
- `"confirm": "Delete this order?"` on step opens dialog first; cancel skips that step and every later one. Put on first step. Never build confirm dialog entries.
- `"debounce": true` on step: it and later steps run after 300 ms without another call, with latest `evt`; earlier steps run at once. Search: `"onChange": [{ "set": "scopes.root.q", "expr": "evt.value" }, { "set": "scopes.root.rows", "expr": "Api_search({ q: scopes.root.q })", "debounce": true }]`. Never call host function on every keystroke.
- Patterns:
  - Remove item: `{ "set": "scopes.root.rows", "expr": "currentValue.filter(r => r.id !== scopes.row.id)" }`
  - Edit row field: `{ "set": "scopes.row.qty", "expr": "evt.value" }`
  - Edit row from outside its list, replacing array: `{ "set": "scopes.root.rows", "expr": "currentValue.map(r => r.id === scopes.root.selectedId ? { ...r, qty: 0 } : r)" }`

## 8. Hidden and loading

- `hidden`: bare expression, not `{ "expr": ... }`. Truthy hides element. Hidden element keeps state, and its expressions still run: guard them, `scopes.root.user?.name`.
- `loading`: bare expression. Truthy shows component busy, content kept. For refreshes; first load shows skeleton by itself. Set flag, call, clear flag: `{ "loading": "scopes.root.busy" }` and `"onClick": [{ "set": "scopes.root.busy", "literal": true }, { "set": "scopes.root.rows", "expr": "Api_list()" }, { "set": "scopes.root.busy", "literal": false }]`. Seed `busy: false` on root.

## 9. Host functions

- Listed under **Available Functions**. Call in `seed` and `callbacks` steps only, never in `props`, `hidden`, `loading`, `each`.
- One argument matching documented input; none when no input: `Api_list()`, `Api_delete({ id: scopes.row.id })`, never `Api_delete(scopes.row.id)`.
- Call is step's result: whole expression, `?:` branch, or right side of `&&`, `||`, `??` (`scopes.root.q ? Api_search({ q: scopes.root.q }) : []`). Runtime awaits it, writes result to `set`. Read result in later step or in `props`. Rejected: `Api_list().length`, `[A(), B()]`, `ids.map(id => Api_get({ id }))`. Many ids: call one function taking all.
- Function offers window, sort or filters (limit, offset, page, cursor, sort, filter fields): use them. Fetch slice you render; refetch when page or filter changes. Never filter or sort fetched slice in expression unless it holds every matching row (`total <= limit`). Read returned totals instead of summing rows.
- Mutate in callback, then refetch.
- Function returning `unknown`: shape undeclared, not empty. Call for effect only (step without `set`), then refetch through function with documented return. Never read fields off it; never call in seed.
  - ✅ `[{ "expr": "Api_archive({ id: scopes.row.id })" }, { "set": "scopes.root.rows", "expr": "Api_list()" }]`

## 10. Replacing entries

- Re-emit `key` to replace its entry, later in same output or later turn. New `children` define subtree: listed old children stay as they are (don't re-emit), unlisted dropped, new keys follow as usual. To fix only entry, keep `children` same.
- State survives. Seed that succeeded never re-runs; failed one runs again once fixed. New state: new key's seed, or callback.
- Broken entry (bad expression, unknown function, bad syntax) shows error in its place; rest of UI works. Re-emit it fixed, once, only when sure. No trial and error.

# Expression Context

Expressions use language under **JavaScript Expressions**, plus these names:

- `scopes` — state (§4). `scopes.root` always exists; list rows add `scopes.<as>` and `scopes.$<as>`.
- `evt` — handler's payload, callbacks only.
- `currentValue` — value at step's `set` field, only in steps with `set`.
- Host functions under **Available Functions** — steps only, called bare: `getUsers()`, never `await getUsers()`.
