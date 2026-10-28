Acts on the live UI the user sees, as the user would: writes its state, calls functions. The UI updates at once. No value comes back to you: the user sees the result on screen.

- `steps`: callback steps (§7), run in order: `{ "set": "scopes.root.<field>", "expr": "..." }`, or `"literal"` instead of `"expr"`. Step without `set` runs for its effect, like a function call. `currentValue`: value at step's `set` field. `"confirm"` on step asks user first. Only `scopes.root`: no `evt`, no row scopes. Expressions read the data themselves: `scopes.root.products.filter(p => p.stock < 5)`.
- Result: `{}` when the steps ran; `{ "declined": true }` when user declined a `confirm`: stop, don't ask again; or `{ "error": { "reason": "...", "message": "..." } }`: fix and call again.
- Write paths the UI already reads (selection, filters, page): find them in UI's entries. Path no element reads changes nothing on screen.
- To change what UI shows (new column, new control), emit new UI instead.
