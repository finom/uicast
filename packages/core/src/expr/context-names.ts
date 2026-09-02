// The names uicast itself binds into every expression. A host function may not take one — it would shadow the context silently.
export const CONTEXT_NAMES: ReadonlySet<string> = new Set(["scopes", "evt", "currentValue"]);
