Acts on the live UI the user sees, as the user would: reads its state, writes it, calls functions. The UI updates at once.

- `steps`: callback steps (§7), run in order: `{ "set": "scopes.root.<field>", "expr": "..." }`, or `"literal"` instead of `"expr"`. Step without `set` runs for its effect, like a function call. `currentValue`: value at step's `set` field. `"confirm"` on step asks user first. Only `scopes.root`: no `evt`, no row scopes.
- `read`: expression over `scopes.root`; its value comes back. Read before writing when you need data: `scopes.root.products.map(p => ({ id: p.id, name: p.name }))`. Pick fields, `slice`: value over 🔴MAX_READ🔴 characters is refused.
- Both: steps run first, then `read`.
- Result: `{ "value": ... }`; `{ "declined": true }` when user declined a `confirm`: stop, don't ask again; or `{ "error": { "reason": "...", "message": "..." } }`: fix and call again.
- Write paths the UI already reads (selection, filters, page): find them in UI's entries. Path no element reads changes nothing on screen.
- To change what UI shows (new column, new control), emit new UI instead.
