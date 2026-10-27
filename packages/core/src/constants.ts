// The prompt tells the model this number too.
export const CALLBACK_DEBOUNCE_MS = 300;

// A host function may not take one of these: it would shadow the context.
export const CONTEXT_NAMES: ReadonlySet<string> = new Set(["scopes", "evt", "currentValue"]);

// The longest `read` value the expr tool hands back, in JSON characters; the prompt tells the model.
export const EXPR_TOOL_MAX_READ = 8_000;
